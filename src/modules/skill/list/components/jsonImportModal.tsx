"use client";

import { useMemo, useState } from "react";
import classnames from "classnames/bind";
import s from "./jsonImport.module.scss";
import Button from "@/components/common/Button";
import { importCards, type CardImportResult } from "@/apis/card";

const cx = classnames.bind(s);

interface SkillJson {
  id?: unknown;
  name?: unknown;
  upgrades?: unknown[];
}

const parse = (
  text: string,
): { skills: SkillJson[] | null; error: string | null } => {
  if (text.trim() === "") return { skills: null, error: null };
  try {
    const data = JSON.parse(text);
    const skills: SkillJson[] = Array.isArray(data) ? data : [data];
    const invalid = skills.findIndex((skill) => typeof skill?.id !== "number");
    if (invalid >= 0)
      return {
        skills: null,
        error: `${invalid + 1}번째 스킬에 숫자 id가 없습니다.`,
      };
    return { skills, error: null };
  } catch (e) {
    return {
      skills: null,
      error: `JSON 형식이 올바르지 않습니다. ${e instanceof Error ? e.message : ""}`,
    };
  }
};

const RESULT_LABELS: [keyof CardImportResult, string][] = [
  ["skillCount", "스킬"],
  ["cardCount", "카드"],
  ["effectCount", "효과"],
  ["variantCount", "변형"],
  ["requiredCardCountCount", "선행 조건"],
  ["exclusionCount", "배제 조건"],
];

interface JsonImportModalProps {
  onClose: () => void;
  onImported: () => void;
}

export default function JsonImportModal({
  onClose,
  onImported,
}: JsonImportModalProps) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CardImportResult | null>(null);
  const { skills, error: parseError } = useMemo(() => parse(text), [text]);

  const cardCount =
    skills?.reduce((sum, skill) => sum + (skill.upgrades?.length ?? 0), 0) ?? 0;

  const loadFile = async (file: File | undefined) => {
    if (!file) return;
    setText(await file.text());
    setResult(null);
    setError(null);
  };

  const submit = async () => {
    if (!skills || busy) return;
    setBusy(true);
    setError(null);
    try {
      setResult(await importCards(skills));
      onImported();
    } catch (e) {
      setError(e instanceof Error ? e.message : "등록에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={cx("overlay")} onClick={onClose}>
      <div
        className={cx("modal")}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={cx("head")}>
          <h2 className={cx("title")}>JSON으로 강화 카드 등록</h2>
          <button
            type="button"
            className={cx("close")}
            onClick={onClose}
            aria-label="닫기"
          >
            ×
          </button>
        </div>
        <p className={cx("desc")}>
          유니티 Skills.json 형태의 스킬 배열을 넣으면 각 스킬의
          upgrades(카드·효과·변형·선행·배제)를 한 번에 등록합니다. 스킬은 미리
          등록되어 있어야 하고, 서버에 없는 필드는 무시됩니다.
        </p>

        <div className={cx("fileRow")}>
          <label className={cx("fileButton")}>
            파일 선택
            <input
              type="file"
              accept=".json,application/json"
              onChange={(e) => loadFile(e.target.files?.[0])}
            />
          </label>
          <span className={cx("hint")}>또는 아래에 붙여넣기</span>
        </div>

        <textarea
          className={cx("textarea")}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setResult(null);
            setError(null);
          }}
          placeholder={
            '[\n  { "id": 1, "upgrades": [ { "id": "arrow_sharp", "name": "화살 강화", ... } ] }\n]'
          }
          spellCheck={false}
        />

        {parseError ? (
          <p className={cx("error")}>{parseError}</p>
        ) : (
          skills && (
            <p className={cx("summary")}>
              스킬 {skills.length}개 · 카드 {cardCount}장
            </p>
          )
        )}
        {error && <p className={cx("error")}>{error}</p>}
        {result && (
          <div className={cx("result")}>
            <strong>등록 완료</strong>
            {RESULT_LABELS.map(([key, label]) => (
              <span key={key}>
                {label} {result[key]}
              </span>
            ))}
          </div>
        )}

        <div className={cx("footer")}>
          <Button variant="outline" onClick={onClose}>
            {result ? "닫기" : "취소"}
          </Button>
          <Button
            onClick={submit}
            disabled={!skills || busy || result !== null}
          >
            {busy ? "등록 중..." : "등록"}
          </Button>
        </div>
      </div>
    </div>
  );
}

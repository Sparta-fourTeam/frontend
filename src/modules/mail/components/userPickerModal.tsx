"use client";

import { useEffect, useState } from "react";
import classnames from "classnames/bind";
import s from "./userPicker.module.scss";
import Button from "@/components/common/Button";
import { USER_SEARCH_SIZE, searchUsers, type UserSummary } from "@/apis/mail";

const cx = classnames.bind(s);

interface UserPickerModalProps {
  selected: UserSummary[];
  // true면 한 명만 고르고, 고르는 즉시 닫힌다.
  single?: boolean;
  title?: string;
  onConfirm: (users: UserSummary[]) => void;
  onClose: () => void;
}

// 닉네임으로 유저를 검색해 여러 명 선택하는 팝업
export default function UserPickerModal({
  selected,
  single = false,
  title = "받는 유저 선택",
  onConfirm,
  onClose,
}: UserPickerModalProps) {
  const [keyword, setKeyword] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [picked, setPicked] = useState<Map<number, UserSummary>>(
    () => new Map(selected.map((u) => [u.userId, u])),
  );

  useEffect(() => {
    let ignore = false;
    searchUsers(query)
      .then((data) => {
        if (ignore) return;
        setResults(data);
        setError(null);
      })
      .catch((e) => {
        if (ignore) return;
        setResults([]);
        setError(e instanceof Error ? e.message : "검색에 실패했습니다.");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [query]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // 어느 화면의 form 안에서 열려도 form이 겹치지 않도록 <form> 대신 버튼·Enter 키로 검색한다.
  const search = () => {
    if (keyword.trim() === query) return;
    setLoading(true);
    setQuery(keyword.trim());
  };

  const toggle = (user: UserSummary) => {
    if (single) return onConfirm([user]);
    setPicked((prev) => {
      const next = new Map(prev);
      if (next.has(user.userId)) next.delete(user.userId);
      else next.set(user.userId, user);
      return next;
    });
  };

  const allPicked =
    results.length > 0 && results.every((u) => picked.has(u.userId));
  const toggleAll = () =>
    setPicked((prev) => {
      const next = new Map(prev);
      for (const user of results) {
        if (allPicked) next.delete(user.userId);
        else next.set(user.userId, user);
      }
      return next;
    });

  return (
    <div className={cx("overlay")} onClick={onClose}>
      <div
        className={cx("modal")}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={cx("head")}>
          <h2 className={cx("title")}>{title}</h2>
          <button
            type="button"
            className={cx("close")}
            onClick={onClose}
            aria-label="닫기"
          >
            ×
          </button>
        </div>

        <div className={cx("search")}>
          <input
            className={cx("input")}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              // 바깥 form이 있어도 제출(우편 발송)로 번지지 않게 막는다.
              e.preventDefault();
              search();
            }}
            placeholder="닉네임 검색 (비우면 최근 가입 유저)"
            autoFocus
          />
          <Button size="small" onClick={search} disabled={loading}>
            검색
          </Button>
        </div>

        <div className={cx("results")}>
          {loading ? (
            <p className={cx("message")}>검색 중...</p>
          ) : error ? (
            <p className={cx("error")}>{error}</p>
          ) : results.length === 0 ? (
            <p className={cx("message")}>검색 결과가 없습니다.</p>
          ) : (
            <>
              {!single && (
                <label className={cx("row")}>
                  <input
                    type="checkbox"
                    checked={allPicked}
                    onChange={toggleAll}
                  />
                  <span className={cx("nickname", "noNickname")}>
                    검색 결과 전체 선택 ({results.length}명
                    {results.length >= USER_SEARCH_SIZE && ", 최대 표시 수"})
                  </span>
                </label>
              )}
              {results.map((user) => (
                <label key={user.userId} className={cx("row")}>
                  <input
                    type={single ? "radio" : "checkbox"}
                    name="userPick"
                    checked={picked.has(user.userId)}
                    onChange={() => toggle(user)}
                  />
                  <span
                    className={cx("nickname", { noNickname: !user.nickname })}
                  >
                    {user.nickname ?? "닉네임 없음"}
                  </span>
                  <span className={cx("id")}>#{user.userId}</span>
                </label>
              ))}
            </>
          )}
        </div>

        {!single && (
          <div className={cx("foot")}>
            <span className={cx("count")}>{picked.size}명 선택됨</span>
            <div>
              <Button size="small" variant="outline" onClick={onClose}>
                취소
              </Button>{" "}
              <Button
                size="small"
                onClick={() => onConfirm([...picked.values()])}
              >
                선택 완료
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

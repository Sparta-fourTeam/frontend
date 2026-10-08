"use client";

import { useState } from "react";
import classnames from "classnames/bind";
import s from "./NameLabelManager.module.scss";
import Button from "@/components/common/Button";
import type { NameLabelRequest } from "@/apis/nameLabel";

const cx = classnames.bind(s);

interface NameLabelFormProps {
  onSubmit: (body: NameLabelRequest) => Promise<boolean>;
  namePlaceholder?: string;
  labelPlaceholder?: string;
}

// 등록 폼
export default function NameLabelForm({
  onSubmit,
  namePlaceholder = "이름",
  labelPlaceholder = "표시 이름",
}: NameLabelFormProps) {
  const [name, setName] = useState("");
  const [label, setLabel] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const ok = await onSubmit({ name: name.trim(), label: label.trim() });
    setSubmitting(false);
    if (ok) {
      setName("");
      setLabel("");
    }
  };

  return (
    <form className={cx("form")} onSubmit={handleSubmit}>
      <input
        className={cx("input")}
        placeholder={namePlaceholder}
        value={name}
        // 영문 대소문자, 숫자, 밑줄만 (첫 글자는 영문)
        onChange={(e) => setName(e.target.value)}
        pattern="[A-Za-z][A-Za-z0-9_]*"
        title="영문으로 시작하고 영문 대소문자, 숫자, 밑줄만 사용할 수 있습니다"
        maxLength={30}
        required
      />
      <input
        className={cx("input")}
        placeholder={labelPlaceholder}
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        maxLength={255}
        required
      />
      <Button type="submit" disabled={submitting}>
        {submitting ? "등록 중..." : "등록"}
      </Button>
    </form>
  );
}

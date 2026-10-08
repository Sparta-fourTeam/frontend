"use client";

import { useEffect, useState } from "react";
import classnames from "classnames/bind";
import s from "./NameLabelManager.module.scss";
import Title from "@/components/common/Title";
import NameLabelForm from "./NameLabelForm";
import NameLabelTable from "./NameLabelTable";
import type { NameLabelApi, NameLabelItem, NameLabelRequest } from "@/apis/nameLabel";

const cx = classnames.bind(s);

interface NameLabelManagerProps {
  title: string;
  subtitle?: string;
  itemName: string;
  api: NameLabelApi;
  namePlaceholder?: string;
  labelPlaceholder?: string;
}

// 이름 + 표시 이름 목록을 조회·등록·수정·삭제하는 공통 관리 화면
export default function NameLabelManager({
  title,
  subtitle,
  itemName,
  api,
  namePlaceholder,
  labelPlaceholder,
}: NameLabelManagerProps) {
  const [items, setItems] = useState<NameLabelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 처음 화면에 들어왔을 때 목록 불러오기
  useEffect(() => {
    let ignore = false;
    api
      .getAll()
      .then((data) => {
        if (!ignore) setItems(data);
      })
      .catch((e) => {
        if (!ignore) setError(e instanceof Error ? e.message : "목록을 불러오지 못했습니다.");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [api]);

  // 등록/수정/삭제 공통 처리: 실패하면 에러 메시지, 성공하면 목록 새로고침 후 null
  const run = async (action: () => Promise<unknown>) => {
    try {
      await action();
    } catch (e) {
      return e instanceof Error ? e.message : "요청에 실패했습니다.";
    }

    setError(null);
    try {
      setItems(await api.getAll());
    } catch {
      setError("저장은 됐지만 목록을 새로고침하지 못했습니다. 페이지를 새로고침해 주세요.");
    }
    return null;
  };

  const handleCreate = async (body: NameLabelRequest) => {
    const message = await run(() => api.create(body));
    if (message) setError(message);
    return message === null;
  };

  const handleUpdate = (id: number, body: NameLabelRequest) => run(() => api.update(id, body));

  const handleDelete = async (item: NameLabelItem) => {
    if (!confirm(`'${item.label}' ${itemName}을(를) 삭제할까요?`)) return;
    const message = await run(() => api.remove(item.id));
    if (message) setError(message);
  };

  return (
    <>
      <Title title={title} subtitle={subtitle} align="left" />

      <NameLabelForm
        onSubmit={handleCreate}
        namePlaceholder={namePlaceholder}
        labelPlaceholder={labelPlaceholder}
      />

      {error && <p className={cx("error")}>{error}</p>}

      {loading ? (
        <p className={cx("empty")}>불러오는 중...</p>
      ) : (
        <NameLabelTable
          items={items}
          emptyText={`등록된 ${itemName}이(가) 없습니다.`}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      )}
    </>
  );
}

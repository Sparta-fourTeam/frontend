"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import classnames from "classnames/bind";
import s from "../components/rewardDefinition.module.scss";
import Title from "@/components/common/Title";
import Button from "@/components/common/Button";
import RewardDefinitionForm from "../form";
import { useCatalog } from "../form/useCatalog";
import {
  deleteRewardDefinition,
  getRewardDefinition,
  updateRewardDefinition,
  type RewardDefinition,
  type RewardDefinitionRequest,
} from "@/apis/rewardDefinition";

const cx = classnames.bind(s);

interface RewardDefinitionDetailProps {
  definitionId: number;
}

export default function RewardDefinitionDetail({
  definitionId,
}: RewardDefinitionDetailProps) {
  const router = useRouter();
  const { catalog, error: catalogError } = useCatalog();
  const [definition, setDefinition] = useState<RewardDefinition | null>(null);
  const [version, setVersion] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    getRewardDefinition(definitionId)
      .then((data) => {
        if (!ignore) setDefinition(data);
      })
      .catch((e) => {
        if (!ignore)
          setLoadError(
            e instanceof Error ? e.message : "묶음을 불러오지 못했습니다.",
          );
      });
    return () => {
      ignore = true;
    };
  }, [definitionId, version]);

  const handleSubmit = async (value: RewardDefinitionRequest) => {
    try {
      await updateRewardDefinition(definitionId, value);
      router.push("/reward-definitions");
    } catch (e) {
      // 다른 사람이 먼저 수정했으면(버전 불일치 409) 최신 값으로 다시 불러온다.
      setError(
        `${e instanceof Error ? e.message : "수정에 실패했습니다."} 최신 값으로 다시 불러왔습니다.`,
      );
      setVersion((v) => v + 1);
    }
  };

  const handleDelete = async () => {
    if (!definition || !confirm(`'${definition.name}' 묶음을 삭제할까요?`))
      return;
    try {
      await deleteRewardDefinition(definitionId);
      router.push("/reward-definitions");
    } catch (e) {
      setError(e instanceof Error ? e.message : "삭제에 실패했습니다.");
    }
  };

  return (
    <>
      <div className={cx("pageHeader")}>
        <Title
          title={definition ? definition.name : "고정 보상 묶음"}
          subtitle={`묶음 ID ${definitionId}`}
          align="left"
        />
        <Button
          variant="outline"
          onClick={() => router.push("/reward-definitions")}
        >
          목록으로
        </Button>
      </div>
      {(loadError || catalogError) && (
        <p className={cx("error")}>{loadError ?? catalogError}</p>
      )}

      {definition ? (
        <RewardDefinitionForm
          key={`${definition.id}-${definition.version}-${version}`}
          definition={definition}
          catalog={catalog}
          submitText="저장"
          error={error}
          onSubmit={handleSubmit}
          onDelete={handleDelete}
        />
      ) : (
        !loadError && <p className={cx("empty")}>불러오는 중...</p>
      )}
    </>
  );
}

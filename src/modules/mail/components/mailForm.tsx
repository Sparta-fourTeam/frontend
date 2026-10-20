"use client";

import { useEffect, useState } from "react";
import classnames from "classnames/bind";
import s from "../mail.module.scss";
import Button from "@/components/common/Button";
import RewardItemsEditor, {
  validateRewardItemDrafts,
  type RewardItemDraft,
} from "@/components/common/RewardItemsEditor";
import UserPickerModal from "./userPickerModal";
import { getItems, type Item } from "@/apis/item";
import { getTokenUserId } from "@/apis/auth";
import {
  ApiNotReadyError,
  BULK_CURRENCIES,
  MAIL_CURRENCIES,
  MAIL_CONTENT_MAX,
  MAIL_RETENTION_DAYS,
  MAIL_TITLE_MAX,
  sendBroadcastMail,
  sendBulkMail,
  sendMail,
  type MailContent,
  type MailCurrency,
  type UserSummary,
} from "@/apis/mail";
import { useUserInfo } from "@/store/useUserInfo";

const cx = classnames.bind(s);

const preventWheel = (e: React.WheelEvent<HTMLInputElement>) =>
  e.currentTarget.blur();

type TargetMode = "users" | "all";

const EMPTY_CURRENCIES: Record<MailCurrency, string> = {
  exp: "",
  gold: "",
  gem: "",
  energy: "",
};

const amount = (value: string) => (value.trim() === "" ? 0 : Number(value));

export interface SentResult {
  mode: TargetMode;
  users: UserSummary[]; // mode가 users일 때 받은 유저
  sentCount: number;
  content: MailContent;
}

interface MailFormProps {
  onSent: (result: SentResult) => void;
}

export const userLabel = (user: UserSummary) =>
  user.nickname ? `${user.nickname} (#${user.userId})` : `#${user.userId}`;

export default function MailForm({ onSent }: MailFormProps) {
  const myUserId = useUserInfo((state) =>
    getTokenUserId(state.user?.accessToken),
  );
  const [catalog, setCatalog] = useState<Item[]>([]);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [mode, setMode] = useState<TargetMode>("users");
  const [recipients, setRecipients] = useState<UserSummary[]>([]);
  const [idInput, setIdInput] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [currencies, setCurrencies] =
    useState<Record<MailCurrency, string>>(EMPTY_CURRENCIES);
  const [items, setItems] = useState<RewardItemDraft[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    getItems()
      .then((data) => {
        if (!ignore)
          setCatalog(
            [...data].sort((a, b) => a.itemId.localeCompare(b.itemId)),
          );
      })
      .catch((e) => {
        if (!ignore)
          setCatalogError(
            e instanceof Error
              ? e.message
              : "아이템 목록을 불러오지 못했습니다.",
          );
      });
    return () => {
      ignore = true;
    };
  }, []);

  const addRecipients = (users: UserSummary[]) =>
    setRecipients((prev) => {
      const map = new Map(prev.map((u) => [u.userId, u]));
      // 검색으로 고른 정보(닉네임)가 직접 입력한 것보다 우선
      for (const user of users)
        map.set(
          user.userId,
          user.nickname ? user : (map.get(user.userId) ?? user),
        );
      return [...map.values()];
    });

  const addById = () => {
    const ids = idInput
      .split(/[\s,]+/)
      .filter(Boolean)
      .map(Number);
    if (ids.length === 0 || ids.some((id) => !Number.isInteger(id) || id < 1)) {
      setMessage(
        "유저 ID는 1 이상의 숫자로 입력하세요. 여러 명은 쉼표로 구분합니다.",
      );
      return;
    }
    setMessage(null);
    addRecipients(ids.map((userId) => ({ userId, nickname: null })));
    setIdInput("");
  };

  // 여러 명·전체 발송은 서버가 골드만 받으므로 다른 재화 입력을 막는다.
  const isBulk = mode === "all" || recipients.length > 1;
  const isAllowed = (key: MailCurrency) =>
    !isBulk || BULK_CURRENCIES.includes(key);

  const validate = () => {
    if (mode === "users" && recipients.length === 0)
      return "받는 유저를 한 명 이상 선택하세요.";
    if (!title.trim()) return "제목을 입력하세요.";
    if (title.trim().length > MAIL_TITLE_MAX)
      return `제목은 ${MAIL_TITLE_MAX}자 이하입니다.`;
    if (!content.trim()) return "내용을 입력하세요.";
    if (content.trim().length > MAIL_CONTENT_MAX)
      return `내용은 ${MAIL_CONTENT_MAX}자 이하입니다.`;
    for (const { key, label } of MAIL_CURRENCIES) {
      const value = currencies[key].trim();
      if (value !== "" && !/^\d+$/.test(value))
        return `${label}는 0 이상의 정수입니다.`;
    }
    return validateRewardItemDrafts(
      items,
      () => 1,
      (itemId) => catalog.some((item) => item.itemId === itemId),
    );
  };

  const confirmText = () => {
    if (mode === "all")
      return "전체 유저에게 우편을 보낼까요? 모든 계정에 바로 지급 대기 상태로 들어가며 수정·회수할 수 없습니다.";
    if (recipients.length === 1)
      return `${userLabel(recipients[0])}에게 우편을 보낼까요? 보낸 우편은 수정·회수할 수 없습니다.`;
    return `${recipients.length}명에게 우편을 보낼까요? 보낸 우편은 수정·회수할 수 없습니다.`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setNotice(null);
    const invalid = validate();
    setMessage(invalid);
    if (invalid || !confirm(confirmText())) return;

    const body: MailContent = {
      title: title.trim(),
      content: content.trim(),
      // 여러 명·전체 발송에서 막힌 재화는 입력값이 남아 있어도 0으로 보낸다.
      exp: isAllowed("exp") ? amount(currencies.exp) : 0,
      gold: amount(currencies.gold),
      gem: isAllowed("gem") ? amount(currencies.gem) : 0,
      energy: isAllowed("energy") ? amount(currencies.energy) : 0,
      items: items.map((item) => ({
        itemId: item.itemId,
        quantity: Number(item.amount),
      })),
    };
    setBusy(true);
    try {
      let sentCount: number;
      const bulkBody = {
        title: body.title,
        content: body.content,
        gold: body.gold,
        items: body.items,
      };
      if (mode === "all") {
        sentCount = (await sendBroadcastMail(bulkBody)).sentCount;
      } else if (recipients.length === 1) {
        // 한 명은 지금 서버에 있는 단건 발송 API를 쓴다.
        await sendMail({ ...body, userId: recipients[0].userId });
        sentCount = 1;
      } else {
        sentCount = (
          await sendBulkMail({
            ...bulkBody,
            userIds: recipients.map((u) => u.userId),
          })
        ).sentCount;
      }
      onSent({ mode, users: recipients, sentCount, content: body });
      setNotice(
        mode === "all"
          ? `전체 유저 ${sentCount}명에게 보냈습니다.`
          : sentCount < recipients.length
            ? `${recipients.length}명 중 ${sentCount}명에게 보냈습니다. 나머지는 존재하지 않는 유저라 건너뛰었습니다.`
            : `${sentCount}명에게 보냈습니다.`,
      );
      setTitle("");
      setContent("");
      setCurrencies(EMPTY_CURRENCIES);
      setItems([]);
    } catch (err) {
      setMessage(
        err instanceof ApiNotReadyError
          ? `${err.message} — ${mode === "all" ? "전체 발송" : "여러 명 발송"}은 서버에 API가 추가되면 사용할 수 있습니다.`
          : err instanceof Error
            ? err.message
            : "발송에 실패했습니다.",
      );
    }
    setBusy(false);
  };

  const counter = (length: number, max: number) => (
    <span className={cx("count", { over: length > max })}>
      {length} / {max}
    </span>
  );

  return (
    <>
      <form className={cx("card")} onSubmit={handleSubmit}>
        <h2 className={cx("cardTitle")}>우편 보내기</h2>
        <p className={cx("warning")}>
          접속 중인 유저에게는 바로 전달됩니다. 보낸 우편은 수정·회수할 수
          없으니 받는 사람과 보상(재화·첨부 아이템)을 확인하세요. 우편은 수령
          여부와 상관없이 {MAIL_RETENTION_DAYS}일 뒤 자동으로 삭제됩니다.
        </p>
        {catalogError && <p className={cx("error")}>{catalogError}</p>}

        <h3 className={cx("subTitle")}>받는 사람</h3>
        <div className={cx("modeTabs")}>
          {(
            [
              { value: "users", label: "선택한 유저" },
              { value: "all", label: "전체 유저" },
            ] as const
          ).map(({ value, label }) => (
            <label
              key={value}
              className={cx("modeTab", { active: mode === value })}
            >
              <input
                type="radio"
                name="targetMode"
                checked={mode === value}
                onChange={() => setMode(value)}
              />
              {label}
            </label>
          ))}
        </div>

        {mode === "users" ? (
          <div className={cx("recipients")}>
            <div className={cx("recipientActions")}>
              <Button size="small" onClick={() => setPickerOpen(true)}>
                닉네임으로 검색
              </Button>
              <input
                className={cx("input", "idInput")}
                value={idInput}
                onChange={(e) => setIdInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addById();
                  }
                }}
                placeholder="유저 ID 직접 입력 (쉼표로 여러 명)"
              />
              <Button size="small" variant="outline" onClick={addById}>
                추가
              </Button>
              {myUserId != null && (
                <Button
                  size="small"
                  variant="outline"
                  onClick={() =>
                    addRecipients([{ userId: myUserId, nickname: null }])
                  }
                >
                  내 계정
                </Button>
              )}
            </div>
            {recipients.length === 0 ? (
              <p className={cx("meta")}>선택한 유저가 없습니다.</p>
            ) : (
              <div className={cx("chips")}>
                {recipients.map((user) => (
                  <span key={user.userId} className={cx("chip")}>
                    {userLabel(user)}
                    <button
                      type="button"
                      onClick={() =>
                        setRecipients((prev) =>
                          prev.filter((u) => u.userId !== user.userId),
                        )
                      }
                      aria-label={`${userLabel(user)} 빼기`}
                    >
                      ×
                    </button>
                  </span>
                ))}
                {recipients.length > 1 && (
                  <button
                    type="button"
                    className={cx("clearChips")}
                    onClick={() => setRecipients([])}
                  >
                    모두 지우기 ({recipients.length}명)
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <p className={cx("warning", "allWarning")}>
            가입한 모든 유저에게 같은 우편이 발송됩니다.
          </p>
        )}

        <div className={cx("section")}>
          <label className={cx("field")}>
            <span className={cx("fieldLabel")}>
              제목 *{counter(title.trim().length, MAIL_TITLE_MAX)}
            </span>
            <input
              className={cx("input")}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={MAIL_TITLE_MAX}
              placeholder="예: 출석 보상 안내"
            />
          </label>
          <label className={cx("field")}>
            <span className={cx("fieldLabel")}>
              내용 *{counter(content.trim().length, MAIL_CONTENT_MAX)}
            </span>
            <textarea
              className={cx("input", "textarea")}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={MAIL_CONTENT_MAX}
              placeholder="예: 꾸준한 접속에 감사드립니다"
            />
          </label>
        </div>

        <h3 className={cx("subTitle")}>
          보상
          <span className={cx("hint")}>
            받는 유저가 수령해야 지급
            {isBulk &&
              " · 여러 명·전체 발송은 골드와 아이템만 보낼 수 있습니다"}
          </span>
        </h3>
        <div className={cx("currencyGrid")}>
          {MAIL_CURRENCIES.map(({ key, label }) => (
            <label key={key} className={cx("field")}>
              <span className={cx("fieldLabel")}>
                {label}
                {!isAllowed(key) && (
                  <span className={cx("hint")}>한 명 발송만</span>
                )}
              </span>
              <input
                type="number"
                className={cx("input")}
                value={isAllowed(key) ? currencies[key] : ""}
                disabled={!isAllowed(key)}
                onChange={(e) =>
                  setCurrencies((prev) => ({ ...prev, [key]: e.target.value }))
                }
                onWheel={preventWheel}
                min={0}
                step={1}
                placeholder="비우면 0"
              />
            </label>
          ))}
        </div>
        <h3 className={cx("subTitle")}>
          첨부 아이템
          <span className={cx("hint")}>선택 · 수량 1 이상</span>
        </h3>
        <RewardItemsEditor
          items={items}
          options={catalog.map((item) => ({
            value: item.itemId,
            text: item.itemId,
          }))}
          amountPlaceholder="수량"
          minAmount={1}
          onChange={setItems}
        />

        <div className={cx("footer", "formFooter")}>
          {message ? (
            <p className={cx("inlineError")}>{message}</p>
          ) : (
            notice && <p className={cx("success")}>{notice}</p>
          )}
          <Button type="submit" disabled={busy}>
            {busy
              ? "보내는 중..."
              : mode === "all"
                ? "전체 유저에게 보내기"
                : recipients.length > 1
                  ? `${recipients.length}명에게 보내기`
                  : "우편 보내기"}
          </Button>
        </div>
      </form>
      {pickerOpen && (
        <UserPickerModal
          selected={recipients}
          onClose={() => setPickerOpen(false)}
          onConfirm={(users) => {
            // 팝업은 기존 선택(직접 입력 포함)을 그대로 받아 시작하므로 결과로 교체한다.
            setRecipients(users);
            setPickerOpen(false);
          }}
        />
      )}
    </>
  );
}

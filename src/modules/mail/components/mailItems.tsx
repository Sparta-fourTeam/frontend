import classnames from "classnames/bind";
import s from "../mail.module.scss";
import {
  MAIL_CURRENCIES,
  type MailCurrencies,
  type MailItem,
} from "@/apis/mail";

const cx = classnames.bind(s);

interface MailItemsProps extends MailCurrencies {
  items: MailItem[];
}

// 재화(경험치·골드·젬·에너지)와 첨부 아이템 태그 목록. 0인 재화는 숨긴다.
export default function MailItems({ items, ...currencies }: MailItemsProps) {
  const rewards = MAIL_CURRENCIES.filter(({ key }) => currencies[key] > 0);
  if (rewards.length === 0 && items.length === 0)
    return <span className={cx("meta")}>보상 없음</span>;
  return (
    <div className={cx("tags")}>
      {rewards.map(({ key, label }) => (
        <span key={key} className={cx("tag", "currencyTag", key)}>
          {label} {currencies[key].toLocaleString()}
        </span>
      ))}
      {items.map((item) => (
        <span key={item.itemId} className={cx("tag")}>
          {item.itemId} ×{item.quantity}
        </span>
      ))}
    </div>
  );
}

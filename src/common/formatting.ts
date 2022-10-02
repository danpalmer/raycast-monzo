import { Monzo } from "@marceloclp/monzojs";

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "GBP" }).format(value / 100);
}

export function accountTitle(account: Monzo.Accounts.Account): string {
  switch (account.type) {
    case "uk_retail":
      return "Current Account";
    case "uk_retail_joint":
      return "Joint Account";
    case "uk_monzo_flex":
      return "Monzo Flex";
    case "uk_monzo_flex_backing_loan":
      return "Monzo Flex";
  }
}

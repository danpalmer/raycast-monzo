import { Monzo } from "@marceloclp/monzojs";

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "GBP" }).format(value / 100);
}

export function formatSortCode(sortCode: string): string {
  if (sortCode.length != 6) {
    throw new Error("Invalid sort code found");
  }
  return `${sortCode.slice(0, 2)}–${sortCode.slice(2, 4)}–${sortCode.slice(4, 6)}`;
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

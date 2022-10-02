import { useRef, FC } from "react";
import { List, Icon, Color, Detail, ImageMask, Image } from "@raycast/api";
import { useCachedPromise, getAvatarIcon } from "@raycast/utils";
import { Monzo } from "@marceloclp/monzojs";

import { getTransactions } from "../lib/actions";
import { formatCurrency, accountTitle } from "../lib/formatting";

type AccountProps = { account: Monzo.Accounts.Account };
type TransactionProps = { transaction: Monzo.Transactions.ExpandedTransaction<["merchant"]> };

export const TransactionsList: FC<AccountProps> = ({ account }) => {
  const abortable = useRef<AbortController>();
  const { isLoading, data: transactions } = useCachedPromise(getTransactions, [account], { abortable });
  return (
    <List
      navigationTitle={accountTitle(account)}
      enableFiltering
      isLoading={isLoading}
      isShowingDetail
      searchBarPlaceholder="Search transactions"
    >
      {transactions?.map((transaction) => (
        <Transaction key={transaction.id} transaction={transaction} />
      ))}
    </List>
  );
};

const Transaction: FC<TransactionProps> = ({ transaction }) => {
  if (transaction.merchant) {
    return <MerchantTransaction transaction={transaction} />;
  }

  if (transaction.scheme == "uk_retail_pot") {
    return <PotTransaction transaction={transaction} />;
  }

  return <UnknownTransaction transaction={transaction} />;
};

const MerchantTransaction: FC<TransactionProps> = ({ transaction }) => {
  if (!transaction.merchant) {
    return null;
  }

  const amount = transaction.amount;
  const accessory: List.Item.Accessory = {
    icon: amount > 0 ? { source: Icon.Plus, tintColor: Color.Green } : null,
    text: formatCurrency(Math.abs(transaction.amount)),
  };

  const icon: Image.ImageLike = transaction.merchant.logo
    ? { source: transaction.merchant.logo, mask: ImageMask.Circle }
    : getAvatarIcon(transaction.merchant.name);

  return (
    <List.Item
      title={transaction.merchant.name}
      icon={icon}
      accessories={[accessory]}
      detail={
        <List.Item.Detail
          metadata={
            <List.Item.Detail.Metadata>
              <List.Item.Detail.Metadata.Label title="Merchant" text={transaction.merchant.name} />
            </List.Item.Detail.Metadata>
          }
        />
      }
    />
  );
};

const PotTransaction: FC<TransactionProps> = ({ transaction }) => {
  return null;
};

const UnknownTransaction: FC<TransactionProps> = ({ transaction }) => {
  const debugString = `This transaction could not be decoded:
		\`\`\`
		${JSON.stringify(transaction, null, 4)}
		\`\`\`
	`;
  return <List.Item title="Unknown transaction" detail={<List.Item.Detail markdown={debugString} />} />;
};

import { useRef, FC } from "react";
import { List } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { Monzo } from "@marceloclp/monzojs";

import { getAccounts, getBalance, accountTitle } from "./common/actions";
import { formatCurrency } from "./common/formatting";

export default function Command() {
  const abortable = useRef<AbortController>();
  const { isLoading, data: accounts } = useCachedPromise(getAccounts, [], {
    abortable,
  });
  return (
    <List enableFiltering={true} isLoading={isLoading} isShowingDetail>
      {accounts?.map((account: Monzo.Accounts.Account) => (
        <AccountItem account={account} />
      ))}
    </List>
  );
}

type AccountProps = { account: Monzo.Accounts.Account };

const AccountItem: FC<AccountProps> = ({ account }) => {
  return (
    <List.Item
      icon="list-icon.png"
      key={account.id}
      title={accountTitle(account)}
      detail={<AccountDetail account={account} />}
    />
  );
};

const AccountDetail: FC<AccountProps> = ({ account }) => {
  const abortable = useRef<AbortController>();
  const { isLoading, data: balance } = useCachedPromise(getBalance, [account], { abortable });

  if (!balance) {
    return <List.Item.Detail isLoading={isLoading} />;
  }

  const formattedBalance = formatCurrency(balance.total_balance);
  const formattedSpend = formatCurrency(Math.abs(balance.spend_today));
  const ownersTitle = account.owners.length == 1 ? "Owner" : "Owners";
  const ownersValue = account.owners.map((o) => o.preferred_name).join(", ");

  const isUKRetailAccount = account.type == "uk_retail" || account.type == "uk_retail_joint";

  return (
    <List.Item.Detail
      isLoading={isLoading}
      markdown={`# ${formattedBalance}\nCurrent balance across all pots and savings`}
      metadata={
        <List.Item.Detail.Metadata>
          <List.Item.Detail.Metadata.Label title="Today's spend" text={formattedSpend} />
          {balance.local_currency && (
            <>
              <List.Item.Detail.Metadata.Label title="Local currency" text={balance.local_currency} />
              <List.Item.Detail.Metadata.Label
                title="Exchange rate"
                text={formatCurrency(balance.local_exchange_rate)}
              />
            </>
          )}
          <List.Item.Detail.Metadata.Separator />
          {isUKRetailAccount && <UKRetailAccountDetails account={account as Monzo.Accounts.RetailAccount} />}
          <List.Item.Detail.Metadata.Label title={ownersTitle} text={ownersValue} />
        </List.Item.Detail.Metadata>
      }
    />
  );
};

type RetailAccountProps = { account: Monzo.Accounts.RetailAccount };

const UKRetailAccountDetails: FC<RetailAccountProps> = ({ account }) => {
  return (
    <>
      <List.Item.Detail.Metadata.Label title="Account number" text={account.account_number} />
      <List.Item.Detail.Metadata.Label title="Sort code" text={account.sort_code} />
    </>
  );
};

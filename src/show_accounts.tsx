import { useRef, FC } from "react";
import { List, Icon, Color } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { Monzo } from "@marceloclp/monzojs";

import { getPots, getBalance } from "./common/actions";
import { formatCurrency, accountTitle, formatSortCode } from "./common/formatting";

export default function Command() {
  const abortable = useRef<AbortController>();
  const { isLoading, data: accountPots } = useCachedPromise(getPots, [], {
    abortable,
  });
  return (
    <List enableFiltering={true} isLoading={isLoading} isShowingDetail>
      {accountPots?.map(({ account, pots }) => (
        <List.Section key={account.id} title={accountTitle(account)}>
          <AccountItem key={account.id} account={account} />
          {pots.map((pot) => (
            <PotItem key={pot.id} pot={pot} />
          ))}
        </List.Section>
      ))}
    </List>
  );
}

type AccountProps = { account: Monzo.Accounts.Account };
type PotProps = { pot: Monzo.Pot };
type RetailAccountProps = { account: Monzo.Accounts.RetailAccount };

const AccountItem: FC<AccountProps> = ({ account }) => {
  const icon = account.owners.length > 1 ? Icon.TwoPeople : Icon.Person;
  return (
    <List.Item
      title="Account"
      icon={{ tintColor: Color.Green, source: icon }}
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

  const formattedBalance = formatCurrency(balance.balance);
  const formattedTotal = formatCurrency(balance.total_balance);
  const formattedSpend = formatCurrency(Math.abs(balance.spend_today));
  const ownersTitle = account.owners.length == 1 ? "Owner" : "Owners";
  const ownersValue = account.owners.map((o) => o.preferred_name).join(", ");

  const isUKRetailAccount = account.type == "uk_retail" || account.type == "uk_retail_joint";

  return (
    <List.Item.Detail
      isLoading={isLoading}
      metadata={
        <List.Item.Detail.Metadata>
          <List.Item.Detail.Metadata.Label title="Balance" text={formattedBalance} />
          <List.Item.Detail.Metadata.Separator />
          <List.Item.Detail.Metadata.Label title="Total including pots" text={formattedTotal} />
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
          {isUKRetailAccount && <UKRetailAccountDetails account={account as Monzo.Accounts.RetailAccount} />}
          <List.Item.Detail.Metadata.Label title={ownersTitle} text={ownersValue} />
        </List.Item.Detail.Metadata>
      }
    />
  );
};

const UKRetailAccountDetails: FC<RetailAccountProps> = ({ account }) => {
  return (
    <>
      <List.Item.Detail.Metadata.Label title="Account number" text={account.account_number} />
      <List.Item.Detail.Metadata.Label title="Sort code" text={formatSortCode(account.sort_code)} />
    </>
  );
};

const PotItem: FC<PotProps> = ({ pot }) => {
  const icon = pot.has_virtual_cards ? Icon.CreditCard : Icon.Coins;
  return (
    <List.Item title={pot.name} icon={{ source: icon, tintColor: Color.Yellow }} detail={<PotDetail pot={pot} />} />
  );
};

const PotDetail: FC<PotProps> = ({ pot }) => {
  return (
    <List.Item.Detail
      metadata={
        <List.Item.Detail.Metadata>
          <List.Item.Detail.Metadata.Label title="Balance" text={formatCurrency(pot.balance)} />
          {pot.goal_amount && <List.Item.Detail.Metadata.Label title="Goal" text={formatCurrency(pot.goal_amount)} />}
          <List.Item.Detail.Metadata.Separator />
          {pot.round_up && <List.Item.Detail.Metadata.Label title="Rounding up into this pot" />}
        </List.Item.Detail.Metadata>
      }
    />
  );
};

import { useRef } from "react";
import { List } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";

import { getBalances, Account, accountTitle } from "./common/actions";
import { formatCurrency } from "./common/formatting";

export default function Command() {
  const abortable = useRef<AbortController>();
  const { isLoading, data } = useCachedPromise(getBalances, [], { abortable });
  return (
    <List enableFiltering={true} isLoading={isLoading} isShowingDetail>
      {data?.map((account: Account) => (
        <List.Item
          icon="list-icon.png"
          key={account.details.id}
          title={accountTitle(account)}
          detail={
            <List.Item.Detail
              markdown={`# ${formatCurrency(account.balance.total_balance)}`}
              metadata={
                <List.Item.Detail.Metadata>
                  <List.Item.Detail.Metadata.Label
                    title="Today's spend"
                    text={formatCurrency(-account.balance.spend_today)}
                  />
                  <List.Item.Detail.Metadata.Separator />
                  <List.Item.Detail.Metadata.Label title="Account number" text={account.details.account_number} />
                  <List.Item.Detail.Metadata.Label title="Sort code" text={account.details.sort_code} />
                </List.Item.Detail.Metadata>
              }
            />
          }
        />
      ))}
    </List>
  );
}

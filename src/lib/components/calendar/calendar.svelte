<script lang="ts">
import { type DateValue, getLocalTimeZone, isEqualMonth, today } from "@internationalized/date";
import { Calendar as CalendarPrimitive } from "bits-ui";
import type { Snippet } from "svelte";
import { Button } from "$components/button";
import { cn, type WithoutChildrenOrChild } from "$lib/utils.js";
import type { ButtonVariant } from "../button/button.svelte";
import * as Calendar from "./index.js";

let {
  ref = $bindable(null),
  value = $bindable(),
  placeholder = $bindable(),
  class: className,
  weekdayFormat = "short",
  buttonVariant = "ghost",
  captionLayout = "label",
  locale = "en-US",
  months: monthsProp,
  years,
  monthFormat: monthFormatProp,
  yearFormat = "numeric",
  day,
  disableDaysOutsideMonth = false,
  ...restProps
}: WithoutChildrenOrChild<CalendarPrimitive.RootProps> & {
  buttonVariant?: ButtonVariant;
  captionLayout?: "dropdown" | "dropdown-months" | "dropdown-years" | "label";
  months?: CalendarPrimitive.MonthSelectProps["months"];
  years?: CalendarPrimitive.YearSelectProps["years"];
  monthFormat?: CalendarPrimitive.MonthSelectProps["monthFormat"];
  yearFormat?: CalendarPrimitive.YearSelectProps["yearFormat"];
  day?: Snippet<[{ day: DateValue; outsideMonth: boolean }]>;
} = $props();

const monthFormat = $derived.by(() => {
  if (monthFormatProp) return monthFormatProp;
  if (captionLayout.startsWith("dropdown")) return "short";
  return "long";
});

const todayDate = today(getLocalTimeZone());

function goToToday() {
  placeholder = todayDate;
  value = todayDate as never;
}
</script>

<!--
Discriminated Unions + Destructing (required for bindable) do not
get along, so we shut typescript up by casting `value` to `never`.
-->
<CalendarPrimitive.Root
	bind:value={value as never}
	bind:ref
	bind:placeholder
	{weekdayFormat}
	weekStartsOn={1}
	{disableDaysOutsideMonth}
	class={cn(
		"bg-background group/calendar p-3 [--cell-size:--spacing(8)] [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent",
		className
	)}
	{locale}
	{monthFormat}
	{yearFormat}
	{...restProps}
>
	{#snippet children({ months, weekdays })}
		<Calendar.Months>
			<Calendar.Nav>
				<Calendar.PrevButton variant={buttonVariant} />
				<Calendar.NextButton variant={buttonVariant} />
			</Calendar.Nav>
			{#each months as month, monthIndex (month)}
				<Calendar.Month>
					<Calendar.Header>
						<Calendar.Caption
							{captionLayout}
							months={monthsProp}
							{monthFormat}
							{years}
							{yearFormat}
							month={month.value}
							bind:placeholder
							{locale}
							{monthIndex}
						/>
					</Calendar.Header>
					<Calendar.Grid>
						<Calendar.GridHead>
							<Calendar.GridRow class="select-none">
								{#each weekdays as weekday (weekday)}
									<Calendar.HeadCell>
										{weekday.slice(0, 2)}
									</Calendar.HeadCell>
								{/each}
							</Calendar.GridRow>
						</Calendar.GridHead>
						<Calendar.GridBody>
							{#each month.weeks as weekDates (weekDates)}
								<Calendar.GridRow class="mt-2 w-full">
									{#each weekDates as date (date)}
										<Calendar.Cell {date} month={month.value}>
											{#if day}
												{@render day({
													day: date,
													outsideMonth: !isEqualMonth(date, month.value),
												})}
											{:else}
												<Calendar.Day />
											{/if}
										</Calendar.Cell>
									{/each}
								</Calendar.GridRow>
							{/each}
						</Calendar.GridBody>
					</Calendar.Grid>
				</Calendar.Month>
			{/each}
		</Calendar.Months>
		<div class="mt-2 flex justify-center">
			<Button variant="outline" class="h-7 px-3 text-xs" onclick={goToToday}>Today</Button>
		</div>
	{/snippet}
</CalendarPrimitive.Root>

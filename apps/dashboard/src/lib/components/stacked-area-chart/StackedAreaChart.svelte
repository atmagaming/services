<script lang="ts">
import { LineChart } from "echarts/charts";
import { GridComponent, LegendComponent, MarkLineComponent, TooltipComponent } from "echarts/components";
import * as echarts from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { onDestroy, onMount } from "svelte";
import { browser } from "$app/environment";
import type { ChartSeries } from "$lib/api";
import "$lib/date-extensions";
import type { Snippet } from "svelte";

const monthLabel = (m: string) => Date.fromIso(`${m}-01`).toLocaleString("en-US", { month: "short", year: "numeric" });

function quarterTicks(months: string[]): string[] {
  if (months.length === 0) return [];
  const special = new Set([months[0], months[months.length - 1]]);
  return months.filter((m) => {
    const month = Number(m.split("-")[1]);
    return month === 1 || month === 4 || month === 7 || month === 10 || special.has(m);
  });
}

echarts.use([CanvasRenderer, LineChart, GridComponent, TooltipComponent, LegendComponent, MarkLineComponent]);

const {
  title,
  months = [],
  series = [],
  lastHistMonth,
  yAxisFormatter = undefined,
  tooltipValueFormatter = undefined,
  showTotalLabels = false,
  yAxisMin = undefined,
  yAxisMax = undefined,
  actions = undefined,
}: {
  title: string;
  months?: string[];
  series?: ChartSeries[];
  lastHistMonth: string;
  yAxisFormatter?: ((v: number) => string) | undefined;
  tooltipValueFormatter?: ((v: number) => string) | undefined;
  showTotalLabels?: boolean;
  yAxisMin?: number | undefined;
  yAxisMax?: number | undefined;
  actions?: Snippet;
} = $props();

let container = $state<HTMLDivElement | null>(null);
let chart: echarts.ECharts | null = null;
let resizeObserver: ResizeObserver | null = null;

function resolveCssVar(value: string): string {
  if (!browser || !value.startsWith("var(")) return value;
  const varName = value.slice(4, -1).trim();
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || value;
}

const option = $derived(
  (() => {
    const monthsArr = months;
    const seriesArr = series;
    if (monthsArr.length === 0 || seriesArr.length === 0) return {};

    const tickSet = quarterTicks(monthsArr);
    const intervalFlags = monthsArr.map((m) => tickSet.includes(m));

    const defaultValueFormatter = (v: number) => `$${v.toLocaleString()}`;
    const tooltipFmt = tooltipValueFormatter ?? defaultValueFormatter;
    const yFmt = yAxisFormatter ?? defaultValueFormatter;
    const mutedColor = resolveCssVar("var(--text-muted)");

    let histLabels: string[] = [];
    let projLabels: string[] = [];

    if (showTotalLabels) {
      histLabels = monthsArr.map((_, i) => {
        if (seriesArr.every((s) => s.data[i] == null)) return "";
        const sum = seriesArr.reduce((acc, s) => acc + (s.data[i] ?? 0), 0);
        return sum >= 1000 ? `$${Math.round(sum / 1000)}k` : `$${sum}`;
      });
      projLabels = monthsArr.map((_, i) => {
        if (seriesArr.every((s) => s.projData[i] == null)) return "";
        const sum = seriesArr.reduce((acc, s) => acc + (s.projData[i] ?? 0), 0);
        return sum >= 1000 ? `$${Math.round(sum / 1000)}k` : `$${sum}`;
      });
    }

    const echartsSeries: unknown[] = [];

    seriesArr.forEach((s, i) => {
      const isLast = i === seriesArr.length - 1;
      const resolvedColor = resolveCssVar(s.color);
      const hasLabel = showTotalLabels && isLast;

      const hist: Record<string, unknown> = {
        name: s.name,
        type: "line",
        stack: "hist",
        areaStyle: { opacity: 0.25 },
        data: s.data,
        color: resolvedColor,
        symbol: "circle",
        symbolSize: hasLabel ? 1 : 6,
        showSymbol: hasLabel,
        connectNulls: false,
      };

      if (i === 0 && lastHistMonth) {
        hist.markLine = {
          silent: true,
          symbol: "none",
          lineStyle: { type: "dashed", color: mutedColor },
          data: [
            {
              xAxis: lastHistMonth,
              label: {
                show: true,
                formatter: () => monthLabel(lastHistMonth),
                position: "end",
                fontSize: 11,
                color: mutedColor,
              },
            },
          ],
        };
      }

      if (hasLabel) {
        const labels = histLabels;
        hist.label = {
          show: true,
          position: "top",
          fontSize: 10,
          color: mutedColor,
          formatter: (params: { dataIndex: number }) => labels[params.dataIndex] ?? "",
        };
      }

      echartsSeries.push(hist);

      const proj: Record<string, unknown> = {
        name: `${s.name} (proj)`,
        type: "line",
        stack: "proj",
        areaStyle: { opacity: 0.1 },
        lineStyle: { type: "dashed" },
        data: s.projData,
        color: resolvedColor,
        showSymbol: hasLabel,
        symbolSize: 1,
        connectNulls: false,
      };

      if (hasLabel) {
        const labels = projLabels;
        proj.label = {
          show: true,
          position: "top",
          fontSize: 10,
          color: mutedColor,
          formatter: (params: { dataIndex: number }) => labels[params.dataIndex] ?? "",
        };
      }

      echartsSeries.push(proj);
    });

    return {
      tooltip: {
        trigger: "axis",
        appendToBody: true,
        backgroundColor: "#ffffff",
        borderColor: resolveCssVar("var(--border-legacy)"),
        textStyle: { fontSize: 12 },
        formatter(params: Array<{ seriesName: string; value: number | null; color: string; axisValueLabel: string }>) {
          const first = params[0];
          if (!first) return "";
          const label = monthLabel(first.axisValueLabel);
          const seen = new Set<string>();
          const lines = params
            .filter((p) => p.value != null)
            .filter((p) => {
              const base = p.seriesName.replace(" (proj)", "");
              if (seen.has(base)) return false;
              seen.add(base);
              return true;
            })
            .map(
              (p) =>
                `<span style="color:${p.color}">${p.seriesName.replace(" (proj)", "")}: ${tooltipFmt(p.value as number)}</span>`,
            );
          return `<strong>${label}</strong><br/>${lines.join("<br/>")}`;
        },
      },
      legend: { show: false },
      grid: { left: 50, right: 30, top: 40, bottom: 30 },
      xAxis: {
        type: "category",
        data: monthsArr,
        axisLabel: {
          formatter: monthLabel,
          interval: (index: number) => intervalFlags[index],
        },
      },
      yAxis: {
        type: "value",
        min: yAxisMin,
        max: yAxisMax,
        axisLabel: { formatter: yFmt },
      },
      series: echartsSeries,
    };
  })(),
);

onMount(() => {
  if (!browser || !container) return;
  chart = echarts.init(container);
  chart.setOption(option as echarts.EChartsCoreOption, true);
  resizeObserver = new ResizeObserver(() => chart?.resize());
  resizeObserver.observe(container);
});

$effect(() => {
  if (chart) chart.setOption(option as echarts.EChartsCoreOption, true);
});

onDestroy(() => {
  resizeObserver?.disconnect();
  chart?.dispose();
});
</script>

<div class="rounded-xl border border-border bg-card p-6 shadow-sm">
  <div class="mb-4 flex items-center justify-between">
    <h2 class="text-lg font-semibold">{title}</h2>
    {@render actions?.()}
  </div>
  <div class="overflow-x-auto">
    <div style={`min-width: ${Math.max(900, months.length * 16)}px;`}>
      <div bind:this={container} style="height: 400px"></div>
    </div>
  </div>
  <div class="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
    {#each series as s}
      <div class="flex items-center gap-1.5 text-sm text-muted-foreground">
        <span class="inline-block h-3 w-3 rounded-sm" style={`background: ${s.color}`}></span>
        {s.name}
      </div>
    {/each}
  </div>
</div>

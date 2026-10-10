<script lang="ts">
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import Icon from "@iconify/svelte";
import { url } from "@utils/url-utils.ts";
import { onMount } from "svelte";
import type { SearchResult } from "@/global";

let keywordDesktop = "";
let keywordMobile = "";
let result: SearchResult[] = [];
let isSearching = false;
let pagefindLoaded = false;
let initialized = false;
let filterType = "all"; // 可选值：all、category、tag
let filterValue = "";   // 具体筛选的值（比如“小说”、“Astro”）
let groupedResult = new Map<string, SearchResult[]>(); // 用来存分组后的结果
let showDropdown = false; // 控制下拉菜单展开

const fakeResult: SearchResult[] = [
	{
		url: url("/"),
		meta: {
			title: "This Is a Fake Search Result",
		},
		excerpt:
			"Because the search cannot work in the <mark>dev</mark> environment.",
	},
	{
		url: url("/"),
		meta: {
			title: "If You Want to Test the Search",
		},
		excerpt: "Try running <mark>npm build && npm preview</mark> instead.",
	},
];

const togglePanel = () => {
	const panel = document.getElementById("search-panel");
	panel?.classList.toggle("float-panel-closed");
};

const setPanelVisibility = (show: boolean, isDesktop: boolean): void => {
	const panel = document.getElementById("search-panel");
	if (!panel || !isDesktop) return;

	if (show) {
		panel.classList.remove("float-panel-closed");
	} else {
		panel.classList.add("float-panel-closed");
	}
};

const search = async (keyword: string, isDesktop: boolean): Promise<void> => {
	if (!keyword) {
		setPanelVisibility(false, isDesktop);
		result = [];
		return;
	}

	if (!initialized) {
		return;
	}

	isSearching = true;

	try {
		let searchResults: SearchResult[] = [];

		        if (import.meta.env.PROD && pagefindLoaded && window.pagefind) {
            // 1. 根据 UI 选择，构建 filters 参数
            const filters: Record<string, string> = {};
            if (filterType !== "all" && filterValue.trim()) {
                filters[filterType] = filterValue.trim();
            }

            // 2. 调用 Pagefind API，传入 filters
            const response = await window.pagefind.search(keyword, {
                filters: Object.keys(filters).length > 0 ? filters : undefined,
            });
            searchResults = await Promise.all(
                response.results.map((item) => item.data()),
            );
        } else if (import.meta.env.DEV) {
            searchResults = fakeResult;
        } else {
            searchResults = [];
            console.error("Pagefind is not available in production environment.");
        }

        // 3. 把结果按分类（category）分组
        const grouped = new Map<string, SearchResult[]>();
        searchResults.forEach((item) => {
            const cat = item.meta?.category || "未分类";
            if (!grouped.has(cat)) grouped.set(cat, []);
            grouped.get(cat)!.push(item);
        });

        result = searchResults;
        groupedResult = grouped; // 存分组结果
        setPanelVisibility(result.length > 0, isDesktop);
	} catch (error) {
		console.error("Search error:", error);
		result = [];
		setPanelVisibility(false, isDesktop);
	} finally {
		isSearching = false;
	}
};

onMount(() => {
	const initializeSearch = () => {
		initialized = true;
		pagefindLoaded =
			typeof window !== "undefined" &&
			!!window.pagefind &&
			typeof window.pagefind.search === "function";
		console.log("Pagefind status on init:", pagefindLoaded);
		if (keywordDesktop) search(keywordDesktop, true);
		if (keywordMobile) search(keywordMobile, false);
	};

	if (import.meta.env.DEV) {
		console.log(
			"Pagefind is not available in development mode. Using mock data.",
		);
		initializeSearch();
	} else {
		document.addEventListener("pagefindready", () => {
			console.log("Pagefind ready event received.");
			initializeSearch();
		});
		document.addEventListener("pagefindloaderror", () => {
			console.warn(
				"Pagefind load error event received. Search functionality will be limited.",
			);
			initializeSearch(); // Initialize with pagefindLoaded as false
		});

		// Fallback in case events are not caught or pagefind is already loaded by the time this script runs
		setTimeout(() => {
			if (!initialized) {
				console.log("Fallback: Initializing search after timeout.");
				initializeSearch();
			}
		}, 2000); // Adjust timeout as needed
	}
});

$: if (initialized && keywordDesktop) {
	(async () => {
		await search(keywordDesktop, true);
	})();
}

$: if (initialized && keywordMobile) {
	(async () => {
		await search(keywordMobile, false);
	})();
}
</script>

<!-- search bar for desktop view -->
<div id="search-bar" class="hidden lg:flex transition-all items-center h-11 mr-2 rounded-lg
      bg-black/[0.04] hover:bg-black/[0.06] focus-within:bg-black/[0.06]
      dark:bg-white/5 dark:hover:bg-white/10 dark:focus-within:bg-white/10
">
    <Icon icon="material-symbols:search" class="absolute text-[1.25rem] pointer-events-none ml-3 transition my-auto text-black/30 dark:text-white/30"></Icon>
    <input placeholder="{i18n(I18nKey.search)}" bind:value={keywordDesktop} on:focus={() => search(keywordDesktop, true)}
           class="transition-all pl-10 text-sm bg-transparent outline-0
         h-full w-40 active:w-60 focus:w-60 text-black/50 dark:text-white/50"
    >
<div class="flex items-center gap-1.5 ml-2 text-xs">
  <!-- 自定义下拉菜单 -->
  <div class="relative">
    <button
      on:click={() => (showDropdown = !showDropdown)}
      class="flex items-center gap-1 px-3 py-1 rounded-lg
             bg-black/5 dark:bg-white/5
             text-black/60 dark:text-white/60
             hover:bg-black/10 dark:hover:bg-white/10
             transition-colors cursor-pointer"
    >
      <span>
        {filterType === "all" ? "全部" : filterType === "category" ? "分类" : "标签"}
      </span>
      <Icon
        icon="material-symbols:keyboard-arrow-down-rounded"
        class="text-[0.9rem]"
      />
    </button>

    <!-- 下拉面板 -->
    {#if showDropdown}
      <!-- 点空白处关闭的遮罩 -->
      <div
        class="fixed inset-0 z-10"
        on:click={() => (showDropdown = false)}
      ></div>
      <div
        class="absolute top-full mt-1 left-0 z-20
               w-20 py-1 rounded-lg
               bg-white dark:bg-[#1e1e2e]
               shadow-lg shadow-black/10 dark:shadow-black/40
               border border-black/10 dark:border-white/10"
      >
        {#each [["all", "全部"], ["category", "分类"], ["tag", "标签"]] as [value, label]}
          <button
            on:click={() => {
              filterType = value;
              showDropdown = false;
              search(keywordDesktop, true);
            }}
            class="w-full text-left px-3 py-1.5 rounded-md transition-colors
                   {filterType === value
                     ? 'bg-[var(--primary)]/15 text-[var(--primary)] font-medium'
                     : 'text-black/60 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/10'}"
          >
            {label}
          </button>
        {/each}
      </div>
    {/if}
  </div>

  <!-- 筛选值输入框 -->
  {#if filterType !== "all"}
    <input
      bind:value={filterValue}
      on:input={() => search(keywordDesktop, true)}
      placeholder={filterType === 'category' ? '分类名' : '标签名'}
      class="w-20 px-2.5 py-1 rounded-lg
             bg-black/5 dark:bg-white/5
             text-black/70 dark:text-white/70
             placeholder:text-black/30 dark:placeholder:text-white/30
             outline-0 focus:bg-black/10 dark:focus:bg-white/10
             transition-colors"
    />
  {/if}
</div>
</div>

<!-- toggle btn for phone/tablet view -->
<button on:click={togglePanel} aria-label="Search Panel" id="search-switch"
        class="btn-plain scale-animation lg:!hidden rounded-lg w-11 h-11 active:scale-90">
    <Icon icon="material-symbols:search" class="text-[1.25rem]"></Icon>
</button>

<!-- search panel -->
<div id="search-panel" class="float-panel float-panel-closed search-panel absolute md:w-[30rem]
top-20 left-4 md:left-[unset] right-4 shadow-2xl rounded-2xl p-2">

    <!-- search bar inside panel for phone/tablet -->
    <div id="search-bar-inside" class="flex relative lg:hidden transition-all items-center h-11 rounded-xl
      bg-black/[0.04] hover:bg-black/[0.06] focus-within:bg-black/[0.06]
      dark:bg-white/5 dark:hover:bg-white/10 dark:focus-within:bg-white/10
  ">
        <Icon icon="material-symbols:search" class="absolute text-[1.25rem] pointer-events-none ml-3 transition my-auto text-black/30 dark:text-white/30"></Icon>
        <input placeholder="Search" bind:value={keywordMobile}
               class="pl-10 absolute inset-0 text-sm bg-transparent outline-0
               focus:w-60 text-black/50 dark:text-white/50"
        >
    </div>

    <!-- search results -->
    {#each [...groupedResult.entries()] as [category, items]}
  <div class="text-xs font-bold text-black/40 dark:text-white/40 px-3 pt-4 pb-1">
    {category}
  </div>
  {#each items as item}
    <a href={item.url}
       class="transition first-of-type:mt-2 lg:first-of-type:mt-0 group block
              rounded-xl text-lg px-3 py-2 hover:bg-[var(--btn-plain-bg-hover)] active:bg-[var(--btn-plain-bg-active)]">
      <div class="transition text-90 inline-flex font-bold group-hover:text-[var(--primary)]">
        {item.meta.title}
        <Icon icon="fa6-solid:chevron-right" class="transition text-[0.75rem] translate-x-1 my-auto text-[var(--primary)]"></Icon>
      </div>
      <div class="transition text-sm text-50">
        {@html item.excerpt}
      </div>
    </a>
  {/each}
{/each}
</div>

<style>
  input:focus {
    outline: 0;
  }
  .search-panel {
    max-height: calc(100vh - 100px);
    overflow-y: auto;
  }
</style>

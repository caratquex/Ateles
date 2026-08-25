<script>
  import {
    isOnboardingActive,
    onboardingStep,
    visualPhase,
    appState,
    hasDrawing,
    currentUser,
  } from "./store.js";
  import { fade, fly, slide } from "svelte/transition";
  import {
    Pen,
    Smartphone,
    Sparkles,
    BookOpen,
    CheckCircle2,
    X,
    ArrowRight,
  } from "lucide-svelte";
  import AtelesLogo from "./AtelesLogo.svelte";

  let showCelebration = false;

  // React to phase changes to auto-advance steps
  $: if ($isOnboardingActive) {
    if ($onboardingStep === 1) {
      if ($visualPhase === "ready_to_shake" || $visualPhase === "breaking") {
        onboardingStep.set(2);
      }
    } else if ($onboardingStep === 2) {
      if ($visualPhase === "bloom" && $appState === "home") {
        onboardingStep.set(3);
      }
    } else if ($onboardingStep === 3) {
      if ($appState === "journal_input") {
        onboardingStep.set(4);
      }
    } else if ($onboardingStep === 4) {
      if ($appState === "gallery" || $appState === "journal_view") {
        completeOnboarding();
      }
    }
  }

  export function completeOnboarding() {
    showCelebration = true;
    onboardingStep.set(0);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("ateles_onboarding_completed", "true");
    }
  }

  function dismissCelebration() {
    showCelebration = false;
    isOnboardingActive.set(false);
  }

  function skipTutorial() {
    isOnboardingActive.set(false);
    onboardingStep.set(0);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("ateles_onboarding_completed", "true");
    }
  }

  function openJournal() {
    appState.set("journal_input");
    onboardingStep.set(4);
  }
</script>

{#if $isOnboardingActive && $onboardingStep > 0}
  <aside
    aria-label="Interactive Onboarding Guide"
    class="fixed top-5 left-1/2 -translate-x-1/2 z-[150] w-[92%] max-w-[420px] pointer-events-none"
    in:fly={{ y: -20, duration: 400 }}
    out:fade={{ duration: 250 }}
  >
    <div
      class="pointer-events-auto p-4 sm:p-5 flex flex-col gap-3 shadow-2xl bg-glass backdrop-blur-md rounded-2xl relative overflow-hidden border-none"
    >
      <!-- Header Row: Step indicator badge & Skip button -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span
            class="px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-accent/15 text-accent flex items-center gap-1.5 border-none"
          >
            <span class="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"
            ></span>
            Step {$onboardingStep} of 4
          </span>
          <span class="text-xs font-medium text-text-tertiary">
            {#if $onboardingStep === 1}Draw{:else if $onboardingStep === 2}Shake
              & Drag{:else if $onboardingStep === 3}Create Ateles{:else if $onboardingStep === 4}Save
              Journey{/if}
          </span>
        </div>

        <button
          aria-label="Skip Tutorial"
          class="text-xs text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1 bg-transparent border-none cursor-pointer py-1 px-2 rounded-md hover:bg-surface/50"
          on:click={skipTutorial}
        >
          <span>Skip</span>
          <X size={14} />
        </button>
      </div>

      <!-- Step Content Area -->
      {#if $onboardingStep === 1}
        <div class="flex items-center gap-3" in:fade={{ duration: 150 }}>
          <div
            class="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center text-accent shrink-0 border-none"
          >
            <Pen size={18} />
          </div>
          <div class="flex flex-col flex-1">
            <h2 class="text-sm font-bold text-text-primary m-0">
              1. Draw freely
            </h2>
            <p class="text-xs text-text-secondary m-0 mt-0.5">
              {#if !$hasDrawing}
                Draw anywhere on canvas to begin.
              {:else}
                Tap <strong class="text-accent font-semibold">Done (✓)</strong> below
                when ready.
              {/if}
            </p>
          </div>
        </div>
      {:else if $onboardingStep === 2}
        <div class="flex items-center gap-3" in:fade={{ duration: 150 }}>
          <div
            class="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center text-accent shrink-0 border-none"
          >
            <Smartphone size={18} class="animate-bounce" />
          </div>
          <div class="flex flex-col flex-1">
            <h2 class="text-sm font-bold text-text-primary m-0">
              2. Shake & Drag
            </h2>
            <p class="text-xs text-text-secondary m-0 mt-0.5">
              {#if $visualPhase === "breaking"}
                Shattering... letting go.
              {:else}
                Shake your device or swipe fast to shatter.
              {/if}
            </p>
          </div>
        </div>
      {:else if $onboardingStep === 3}
        <div class="flex items-center gap-3" in:fade={{ duration: 150 }}>
          <div
            class="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center text-accent shrink-0 border-none"
          >
            <Sparkles size={18} />
          </div>
          <div class="flex items-center justify-between flex-1 gap-2">
            <div class="flex flex-col">
              <h2 class="text-sm font-bold text-text-primary m-0">
                3. Ateles Created
              </h2>
              <p class="text-xs text-text-secondary m-0 mt-0.5">
                Tap <strong class="text-text-primary">Journal</strong> below to save.
              </p>
            </div>
            <button
              class="bg-accent text-text-inverse font-semibold text-xs py-1.5 px-3 rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1 cursor-pointer border-none shadow-sm"
              on:click={openJournal}
            >
              <span>Journal</span>
              <ArrowRight size={12} />
            </button>
          </div>
        </div>
      {:else if $onboardingStep === 4}
        <div class="flex items-center gap-3" in:fade={{ duration: 150 }}>
          <div
            class="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center text-accent shrink-0 border-none"
          >
            <BookOpen size={18} />
          </div>
          <div class="flex flex-col flex-1">
            <h2 class="text-sm font-bold text-text-primary m-0">
              4. Save Journey
            </h2>
            <p class="text-xs text-text-secondary m-0 mt-0.5">
              Write a reflection and tap <strong class="text-text-primary"
                >Save (✓)</strong
              >.
            </p>
          </div>
        </div>
      {/if}

      <!-- Progress bar -->
      <div class="w-full bg-accent/10 h-1 rounded-full overflow-hidden mt-0.5 border-none">
        <div
          class="bg-accent h-full transition-all duration-500 ease-out rounded-full"
          style="width: {($onboardingStep / 4) * 100}%"
        ></div>
      </div>
    </div>
  </aside>
{/if}

<!-- Celebration Completion Modal -->
{#if showCelebration}
  <div
    class="fixed inset-0 bg-black/30 backdrop-blur-sm z-[250] flex items-center justify-center p-4"
    in:fade={{ duration: 250 }}
    out:fade={{ duration: 200 }}
  >
    <div
      class="bg-white p-7 sm:p-8 w-[340px] max-w-[90%] flex flex-col items-center text-center gap-5 shadow-2xl rounded-3xl animate-[slideUp_0.3s_cubic-bezier(0.16,1,0.3,1)] border-none"
    >
      <div
        class="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-black border-none"
      >
        <CheckCircle2 size={32} />
      </div>

      <div class="flex flex-col gap-1.5">
        <h2 class="text-neutral-900 text-xl font-bold tracking-tight m-0">
          Journey Saved!
        </h2>
        <p
          class="text-neutral-500 text-xs sm:text-sm font-normal leading-relaxed m-0"
        >
          Your Ateles is now saved in your Gallery.
        </p>
      </div>

      <div class="w-full pt-1">
        <button
          class="w-full bg-black text-white font-semibold py-3 rounded-full hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer border-none shadow-md text-xs sm:text-sm tracking-wide"
          on:click={dismissCelebration}
        >
          View Gallery
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(16px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>

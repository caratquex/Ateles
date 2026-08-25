<script>
  import { supabase } from "./lib/supabase.js";
  import {
    appState,
    currentUser,
    isOnboardingActive,
    onboardingStep,
    visualPhase,
    hasDrawing,
    clearCanvasTrigger,
  } from "./store.js";

  let step = 1; // 1: Username, 2: Questionnaire
  let username = "";
  let selectedAnswer = "";
  let customAnswer = "";
  let loading = false;
  let errorMsg = "";

  const options = [
    "Afraid of ruining what I've made",
    "Trapped by perfectionism",
    "Mistakes feel like failures",
    "Hiding my rough drafts",
    "Ready to let go and break",
    "Other",
  ];

  function handleNext() {
    if (step === 1 && username.trim()) {
      step = 2;
    } else if (step === 2 && selectedAnswer) {
      if (selectedAnswer === "Other" && !customAnswer.trim()) return;
      handleSubmit();
    }
  }

  function handlePlayAsGuest() {
    if (!username.trim()) {
      username = "Guest";
    }
    step = 2;
  }

  async function handleSubmit() {
    loading = true;
    errorMsg = "";

    // Reset canvas state for fresh start
    clearCanvasTrigger.update((v) => v + 1);
    visualPhase.set("drawing");
    hasDrawing.set(false);

    // Activate live on-canvas step-by-step guidance
    isOnboardingActive.set(true);
    onboardingStep.set(1);

    // Transition immediately to live canvas
    appState.set("home");

    if ($currentUser) {
      try {
        const { data, error } = await supabase.auth.updateUser({
          data: {
            username: username.trim() || "Guest",
            mindset_profile:
              selectedAnswer === "Other" ? customAnswer.trim() : selectedAnswer,
          },
        });

        if (error) {
          console.error("Error saving data:", error.message);
        } else if (data && data.user) {
          currentUser.set(data.user);
        }
      } catch (err) {
        console.error(
          "Unexpected error:",
          err instanceof Error ? err.message : String(err),
        );
      } finally {
        loading = false;
      }
    } else {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(
          "ateles_guest_username",
          username.trim() || "Guest",
        );
        localStorage.setItem(
          "ateles_guest_mindset",
          selectedAnswer === "Other" ? customAnswer.trim() : selectedAnswer,
        );
      }
      loading = false;
    }
  }
</script>

<div
  class="flex items-center justify-center h-full w-full bg-bg z-[200] absolute top-0 left-0"
>
  <div
    class="glass-panel p-6 sm:p-8 w-[420px] max-w-[90%] flex flex-col gap-6 relative overflow-hidden shadow-2xl border-none"
  >
    {#if step === 1}
      <div class="flex flex-col gap-1">
        <h1 class="text-text-primary text-2xl font-bold text-center">
          Welcome
        </h1>
        <p class="text-text-secondary text-center text-sm mb-1">
          Choose a username to begin.
        </p>
      </div>

      {#if errorMsg}
        <div
          class="bg-red-500/20 border border-red-500 text-red-500 p-3 rounded-md text-sm"
        >
          {errorMsg}
        </div>
      {/if}

      <div class="flex flex-col gap-2">
        <input
          id="username"
          type="text"
          bind:value={username}
          class="bg-surface/50 text-text-primary px-3 py-2.5 rounded-lg outline-none focus:ring-1 focus:ring-accent transition-all text-center border-none"
          placeholder="Enter username"
          on:keydown={(e) => e.key === "Enter" && handleNext()}
        />
      </div>

      <button
        on:click={handleNext}
        disabled={!username.trim()}
        class="mt-1 bg-text-primary text-bg font-semibold py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer border-none"
      >
        Continue
      </button>

      <button
        type="button"
        on:click={handlePlayAsGuest}
        class="text-text-secondary hover:text-text-primary transition-colors text-xs font-medium py-0.5 bg-transparent border-none cursor-pointer underline text-center"
      >
        Play as Guest
      </button>
    {:else if step === 2}
      <div class="flex flex-col gap-1">
        <h1 class="text-text-primary text-xl font-bold">
          How do you feel?
        </h1>
        <p class="text-text-secondary text-xs">
          Select what resonates most.
        </p>
      </div>

      <div class="flex flex-col gap-2 max-h-[50vh] overflow-y-auto pr-1">
        {#each options as option}
          <label
            class="flex items-center gap-3 cursor-pointer group p-2.5 rounded-lg bg-surface/30 hover:bg-surface/60 transition-colors border-none"
          >
            <input
              type="radio"
              name="description"
              value={option}
              bind:group={selectedAnswer}
              class="w-4 h-4 accent-text-primary cursor-pointer"
            />
            <span
              class="text-text-primary text-sm font-medium leading-tight group-hover:opacity-80 transition-opacity"
            >
              {option}
            </span>
          </label>
        {/each}

        {#if selectedAnswer === "Other"}
          <input
            type="text"
            bind:value={customAnswer}
            class="mt-1 bg-surface/50 text-text-primary px-3 py-2 rounded-lg outline-none focus:ring-1 focus:ring-accent transition-all text-sm border-none"
            placeholder="Specify"
          />
        {/if}
      </div>

      <div
        class="flex justify-between items-center mt-3 pt-2"
      >
        <button
          on:click={() => (step = 1)}
          class="text-text-secondary hover:text-text-primary transition-colors text-sm font-medium px-3 py-2 bg-transparent border-none cursor-pointer"
        >
          Back
        </button>
        <button
          on:click={handleSubmit}
          disabled={!selectedAnswer ||
            (selectedAnswer === "Other" && !customAnswer.trim()) ||
            loading}
          class="bg-text-primary text-bg font-semibold py-2 px-6 rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer border-none flex items-center gap-2"
        >
          {#if loading}
            <span>Starting...</span>
          {:else}
            <span>Begin</span>
          {/if}
        </button>
      </div>
    {/if}
  </div>
</div>

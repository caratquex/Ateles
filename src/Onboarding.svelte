<script>
  import { supabase } from "./lib/supabase.js";
  import { appState, currentUser, isTutorialMode } from "./store.js";
  import AtelesLogo from "./AtelesLogo.svelte";

  let step = $isTutorialMode ? 3 : 1; // 1: Username, 2: Questionnaire, 3-5: Tutorial
  let username = "";
  let selectedAnswer = "";
  let customAnswer = "";
  let loading = false;
  let errorMsg = "";

  const options = [
    "I am terrified of ruining what I have built.",
    "My standards are a cage I cannot escape.",
    "I view my mistakes as personal failures.",
    "I hide my rough drafts from everyone, including myself.",
    "I am ready to break something on purpose.",
    "Other",
  ];

  function handleNext() {
    if (step === 1 && username.trim()) {
      step = 2;
    } else if (step === 2 && selectedAnswer) {
      if (selectedAnswer === "Other" && !customAnswer.trim()) return;
      step = 3;
    } else if (step === 3) {
      step = 4;
    } else if (step === 4) {
      step = 5;
    }
  }

  function handlePlayAsGuest() {
    if (!username.trim()) {
      username = "Guest";
    }
    step = 2;
  }

  async function handleSubmit() {
    if (step === 5) {
      if ($isTutorialMode) {
        isTutorialMode.set(false);
        appState.set("home");
        return;
      }

      loading = true;
      errorMsg = "";

      // Transition immediately to prevent perceived lag
      appState.set("home");

      if ($currentUser) {
        try {
          const { data, error } = await supabase.auth.updateUser({
            data: {
              username: username.trim() || "Guest",
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
          localStorage.setItem("ateles_guest_username", username.trim() || "Guest");
        }
        loading = false;
      }
    }
  }
</script>

<div
  class="flex items-center justify-center h-full w-full bg-bg z-[200] absolute top-0 left-0"
>
  <div
    class="glass-panel p-6 sm:p-8 w-[400px] max-w-[90%] flex flex-col gap-6 relative overflow-hidden"
  >
    {#if step === 1}
      <div class="flex flex-col gap-2">
        <h1 class="text-text-primary text-2xl font-bold text-center">
          Welcome to Ateles
        </h1>
        <p class="text-text-secondary text-center text-sm mb-2">
          Let's get to know you.
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
        <label for="username" class="text-text-secondary text-sm font-medium"
          >Choose a Username</label
        >
        <input
          id="username"
          type="text"
          bind:value={username}
          class="bg-bg border border-border text-text-primary px-3 py-2 rounded-lg outline-none focus:border-text-primary transition-colors"
          placeholder="Enter username"
          on:keydown={(e) => e.key === "Enter" && handleNext()}
        />
      </div>

      <button
        on:click={handleNext}
        disabled={!username.trim()}
        class="mt-2 bg-text-primary text-bg font-semibold py-2 rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer border-none"
      >
        Continue
      </button>

      <button
        type="button"
        on:click={handlePlayAsGuest}
        class="text-text-secondary hover:text-text-primary transition-colors text-sm font-medium py-1 bg-transparent border-none cursor-pointer underline text-center"
      >
        Play as Guest
      </button>
    {:else if step === 2}
      <h1 class="text-text-primary text-xl font-bold mb-2">
        How would you describe yourself?
      </h1>

      <div class="flex flex-col gap-3">
        {#each options as option}
          <label class="flex items-start gap-3 cursor-pointer group">
            <input
              type="radio"
              name="description"
              value={option}
              bind:group={selectedAnswer}
              class="mt-1 w-4 h-4 accent-text-primary cursor-pointer"
            />
            <span
              class="text-text-primary text-sm leading-snug group-hover:opacity-80 transition-opacity"
            >
              {option}
            </span>
          </label>
        {/each}

        {#if selectedAnswer === "Other"}
          <input
            type="text"
            bind:value={customAnswer}
            class="mt-2 bg-bg border border-border text-text-primary px-3 py-2 rounded-lg outline-none focus:border-text-primary transition-colors text-sm"
            placeholder="Please specify"
          />
        {/if}
      </div>

      <div class="flex justify-between mt-4">
        <button
          on:click={() => (step = 1)}
          class="text-text-secondary hover:text-text-primary transition-colors text-sm font-medium px-4 py-2 bg-transparent border-none cursor-pointer"
        >
          Back
        </button>
        <button
          on:click={handleNext}
          disabled={!selectedAnswer ||
            (selectedAnswer === "Other" && !customAnswer.trim())}
          class="bg-text-primary text-bg font-semibold py-2 px-6 rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer"
        >
          Next
        </button>
      </div>
    {:else if step === 3}
      <h1 class="text-text-primary text-2xl font-bold text-center">
        1. Draw something
      </h1>
      <div class="flex justify-center my-6 h-[100px] items-center">
        <svg width="60" height="60" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="40"
            stroke="var(--color-text-primary)"
            stroke-width="8"
            fill="none"
            class="animate-draw"
            stroke-linecap="round"
            stroke-dasharray="251.2"
            stroke-dashoffset="251.2"
          />
        </svg>
      </div>
      <p class="text-text-secondary text-center text-[1rem]">
        Express yourself by drawing freely on the canvas.
      </p>
      <div class="flex justify-between mt-6">
        <button
          on:click={() => {
            if ($isTutorialMode) {
              isTutorialMode.set(false);
              appState.set("home");
            } else {
              step = 2;
            }
          }}
          class="text-text-secondary hover:text-text-primary transition-colors text-sm font-medium px-4 py-2 bg-transparent border-none cursor-pointer"
        >
          {$isTutorialMode ? "Exit" : "Back"}
        </button>
        <button
          on:click={handleNext}
          class="bg-text-primary text-bg font-semibold py-2 px-6 rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
        >
          Next
        </button>
      </div>
    {:else if step === 4}
      <h1 class="text-text-primary text-2xl font-bold text-center">
        2. Shake or Drag
      </h1>
      <div class="flex justify-center my-6 h-[100px] items-center">
        <svg width="40" height="60" viewBox="0 0 40 60" class="animate-shake">
          <rect
            x="5"
            y="5"
            width="30"
            height="50"
            rx="5"
            stroke="var(--color-text-primary)"
            stroke-width="4"
            fill="none"
          />
          <line
            x1="15"
            y1="50"
            x2="25"
            y2="50"
            stroke="var(--color-text-primary)"
            stroke-width="2"
            stroke-linecap="round"
          />
        </svg>
      </div>
      <p class="text-text-secondary text-center text-[1rem]">
        Let go by shaking your device or dragging to shatter the drawing.
      </p>
      <div class="flex justify-between mt-6">
        <button
          on:click={() => (step = 3)}
          class="text-text-secondary hover:text-text-primary transition-colors text-sm font-medium px-4 py-2 bg-transparent border-none cursor-pointer"
        >
          Back
        </button>
        <button
          on:click={handleNext}
          class="bg-text-primary text-bg font-semibold py-2 px-6 rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
        >
          Next
        </button>
      </div>
    {:else if step === 5}
      <h1 class="text-text-primary text-2xl font-bold text-center">
        3. Create your Ateles
      </h1>
      <div class="flex justify-center my-6 h-[100px] items-center">
        <AtelesLogo className="w-20 h-20 text-text-primary" />
      </div>
      <p class="text-text-secondary text-center text-[1rem]">
        Watch your drawing transform into an Ateles, record down your journey.
      </p>

      {#if errorMsg}
        <div
          class="bg-red-500/20 border border-red-500 text-red-500 p-3 rounded-md text-sm mt-4"
        >
          {errorMsg}
        </div>
      {/if}

      <div class="flex justify-between mt-6">
        <button
          on:click={() => (step = 4)}
          class="text-text-secondary hover:text-text-primary transition-colors text-sm font-medium px-4 py-2 bg-transparent border-none cursor-pointer"
        >
          Back
        </button>
        <button
          on:click={handleSubmit}
          disabled={loading}
          class="bg-text-primary text-bg font-semibold py-2 px-6 rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer"
        >
          {#if loading}
            Starting...
          {:else if $isTutorialMode}
            Finish
          {:else}
            Begin
          {/if}
        </button>
      </div>
    {/if}
  </div>
</div>

<style>
  .animate-draw {
    animation: draw 2.5s ease-in-out infinite;
  }
  @keyframes draw {
    0% {
      stroke-dashoffset: 251.2;
    }
    50% {
      stroke-dashoffset: 0;
    }
    80% {
      stroke-dashoffset: 0;
      opacity: 1;
    }
    100% {
      stroke-dashoffset: 0;
      opacity: 0;
    }
  }

  .animate-shake {
    animation: shake 1.5s ease-in-out infinite;
  }
  @keyframes shake {
    0%,
    100% {
      transform: rotate(0deg) translateX(0);
    }
    10%,
    30%,
    50% {
      transform: rotate(10deg) translateX(4px);
    }
    20%,
    40%,
    60% {
      transform: rotate(-10deg) translateX(-4px);
    }
    70% {
      transform: rotate(0deg) translateX(0);
    }
  }
</style>

<script>
  import { supabase } from "./lib/supabase.js";
  import { appState, currentUser } from "./store.js";

  let step = 1; // 1 for username, 2 for question
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

  async function handleNext() {
    if (step === 1 && username.trim()) {
      step = 2;
    }
  }

  async function handleSubmit() {
    if (step === 2 && selectedAnswer) {
      loading = true;
      errorMsg = "";
      try {
        // We only save the username as requested, the answer is just for the experience
        const { data, error } = await supabase.auth.updateUser({
          data: {
            username: username.trim(),
          },
        });

        if (error) {
          errorMsg = error.message || "Error saving data. Please try again.";
          loading = false;
        } else {
          if (data && data.user) {
            currentUser.set(data.user);
          }
          appState.set("home");
        }
      } catch (err) {
        errorMsg = err.message || "An unexpected error occurred.";
        loading = false;
      }
    }
  }
</script>

<div
  class="flex items-center justify-center h-full w-full bg-bg z-[200] absolute top-0 left-0"
>
  <div
    class="bg-surface p-8 rounded-xl shadow-xl w-[400px] max-w-[90%] border border-border-default flex flex-col gap-6"
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
          class="bg-bg border border-border-default text-text-primary px-3 py-2 rounded-md outline-none focus:border-text-primary transition-colors"
          placeholder="Enter username"
          on:keydown={(e) => e.key === "Enter" && handleNext()}
        />
      </div>

      <button
        on:click={handleNext}
        disabled={!username.trim()}
        class="mt-2 bg-text-primary text-bg font-semibold py-2 rounded-md hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        Continue
      </button>
    {:else if step === 2}
      <h1 class="text-text-primary text-xl font-bold mb-2">
        How would you describe yourself?
      </h1>

      {#if errorMsg}
        <div
          class="bg-red-500/20 border border-red-500 text-red-500 p-3 rounded-md text-sm"
        >
          {errorMsg}
        </div>
      {/if}

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
              >{option}</span
            >
          </label>
        {/each}

        {#if selectedAnswer === "Other"}
          <input
            type="text"
            bind:value={customAnswer}
            class="mt-2 bg-bg border border-border-default text-text-primary px-3 py-2 rounded-md outline-none focus:border-text-primary transition-colors text-sm"
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
          on:click={handleSubmit}
          disabled={loading ||
            !selectedAnswer ||
            (selectedAnswer === "Other" && !customAnswer.trim())}
          class="bg-text-primary text-bg font-semibold py-2 px-6 rounded-md hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer"
        >
          {#if loading}
            Saving...
          {:else}
            Finish
          {/if}
        </button>
      </div>
    {/if}
  </div>
</div>

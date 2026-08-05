<script>
  import { supabase } from "./lib/supabase.js";
  import { appState, currentUser } from "./store.js";
  import AtelesLogo from "./AtelesLogo.svelte";

  let step = "landing"; // 'landing' | 'auth'
  let email = "";
  let password = "";
  let loading = false;
  let isSignUp = false;
  let errorMsg = "";

  async function handleAuth() {
    loading = true;
    errorMsg = "";

    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) {
        errorMsg = error.message;
      } else {
        if (data.user?.identities?.length === 0) {
          errorMsg = "Email already taken.";
        } else {
          alert("Signup successful! You can now log in.");
          isSignUp = false;
        }
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        if (error.message === "Failed to fetch") {
          errorMsg = "Network error connecting to database. Please check your connection or use 'Play as Guest'.";
        } else {
          errorMsg = error.message;
        }
      } else if (data && data.user) {
        if (!data.session) {
          errorMsg = "Login unsuccessful. Please verify your email address.";
          alert(errorMsg);
        } else {
          currentUser.set(data.user);
          if (data.user.user_metadata?.username) {
            appState.set("home");
          } else {
            appState.set("onboarding");
          }
        }
      } else {
        errorMsg = "Login unsuccessful. Please try again.";
        alert(errorMsg);
      }
    }
    loading = false;
  }
</script>

<div
  class="flex flex-col items-center justify-center h-full w-full bg-bg z-[200] absolute top-0 left-0 p-6 sm:p-8"
>
  {#if step === "landing"}
    <div
      class="flex flex-col items-center justify-center w-full h-full cursor-pointer hover:opacity-90 transition-opacity"
      on:click={() => (step = "auth")}
    >
      <div class="w-48 h-48 mb-20 animate-[spin_20s_linear_infinite] flex items-center justify-center">
        <AtelesLogo className="w-full h-full drop-shadow-sm text-black" />
      </div>
      <h1 class="text-text-primary text-4xl font-medium mb-4 tracking-wide">
        Welcome
      </h1>
      <p class="text-text-secondary text-sm tracking-wider">Click to start</p>
    </div>
  {:else}
    <div
      class="w-[400px] max-w-[90%] flex flex-col gap-6 items-center animate-[fadeIn_0.3s_ease]"
    >
      <div class="w-32 h-32 mb-8 animate-[spin_20s_linear_infinite] flex items-center justify-center">
        <AtelesLogo className="w-full h-full drop-shadow-sm text-black" />
      </div>

      {#if errorMsg}
        <div
          class="w-full bg-red-500/20 border border-red-500 text-red-500 p-3 rounded-md text-sm"
        >
          {errorMsg}
        </div>
      {/if}

      <div class="flex flex-col gap-2 w-full">
        <label for="email" class="text-text-primary text-sm font-medium"
          >Email</label
        >
        <input
          id="email"
          type="email"
          bind:value={email}
          class="bg-[#E6E6E6] border-none text-text-primary px-4 py-3.5 rounded-xl outline-none focus:ring-2 focus:ring-text-secondary transition-all placeholder:text-gray-400"
          placeholder="Enter your email"
        />
      </div>

      <div class="flex flex-col gap-2 w-full">
        <label for="password" class="text-text-primary text-sm font-medium"
          >Password</label
        >
        <input
          id="password"
          type="password"
          bind:value={password}
          class="bg-[#E6E6E6] border-none text-text-primary px-4 py-3.5 rounded-xl outline-none focus:ring-2 focus:ring-text-secondary transition-all placeholder:text-gray-400"
          placeholder="Enter your password"
          on:keydown={(e) => e.key === "Enter" && handleAuth()}
        />
      </div>

      <button
        on:click={handleAuth}
        disabled={loading || !email || !password}
        class="mt-4 w-3/4 max-w-[200px] bg-text-secondary text-bg font-bold py-3.5 rounded-full hover:opacity-90 disabled:opacity-50 transition-opacity text-base shadow-md"
      >
        {#if loading}
          Loading...
        {:else if isSignUp}
          Sign up
        {:else}
          Login
        {/if}
      </button>

      <div class="text-center mt-2 flex flex-col items-center gap-3 w-full">
        <div>
          <span class="text-text-secondary text-sm">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}
          </span>
          <button
            class="text-text-primary text-sm font-medium hover:underline transition-all cursor-pointer bg-transparent border-none ml-1"
            on:click={() => {
              isSignUp = !isSignUp;
              errorMsg = "";
            }}
          >
            {isSignUp ? "Login" : "Sign up"}
          </button>
        </div>

        <div class="w-full flex items-center gap-3 my-1">
          <div class="h-[1px] bg-border/40 flex-1"></div>
          <span class="text-xs text-text-tertiary uppercase tracking-wider">or</span>
          <div class="h-[1px] bg-border/40 flex-1"></div>
        </div>

        <button
          type="button"
          class="text-text-secondary hover:text-text-primary text-sm font-medium transition-all cursor-pointer bg-transparent border-none underline"
          on:click={() => appState.set("onboarding")}
        >
          Play as Guest
        </button>
      </div>
    </div>
  {/if}
</div>

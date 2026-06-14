<script>
  import { supabase } from './lib/supabase.js';
  import { appState, currentUser } from './store.js';

  let email = '';
  let password = '';
  let loading = false;
  let isSignUp = false;
  let errorMsg = '';

  async function handleAuth() {
    loading = true;
    errorMsg = '';
    
    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) {
        errorMsg = error.message;
      } else {
        if (data.user?.identities?.length === 0) {
          errorMsg = 'Email already taken.';
        } else {
          // Signup successful, usually auto-logs in if email confirmation is disabled
          // Otherwise, notify them to check email
          alert('Signup successful! You can now log in.');
          isSignUp = false;
        }
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        errorMsg = error.message;
      } else {
        // Success, session will be caught by onAuthStateChange in App.svelte
      }
    }
    loading = false;
  }
</script>

<div class="flex items-center justify-center h-full w-full bg-bg z-[200] absolute top-0 left-0">
  <div class="bg-surface p-6 sm:p-8 rounded-xl shadow-xl w-[400px] max-w-[90%] border border-border-default flex flex-col gap-4">
    <h1 class="text-text-primary text-2xl font-bold text-center mb-2">
      {isSignUp ? 'Create an Account' : 'Welcome to Ateles'}
    </h1>
    
    {#if errorMsg}
      <div class="bg-red-500/20 border border-red-500 text-red-500 p-3 rounded-md text-sm">
        {errorMsg}
      </div>
    {/if}

    <div class="flex flex-col gap-2">
      <label for="email" class="text-text-secondary text-sm font-medium">Email</label>
      <input 
        id="email" 
        type="email" 
        bind:value={email} 
        class="bg-bg border border-border-default text-text-primary px-3 py-2 rounded-md outline-none focus:border-text-primary transition-colors"
        placeholder="Enter your email" 
      />
    </div>

    <div class="flex flex-col gap-2">
      <label for="password" class="text-text-secondary text-sm font-medium">Password</label>
      <input 
        id="password" 
        type="password" 
        bind:value={password} 
        class="bg-bg border border-border-default text-text-primary px-3 py-2 rounded-md outline-none focus:border-text-primary transition-colors"
        placeholder="Enter your password" 
      />
    </div>

    <button 
      on:click={handleAuth} 
      disabled={loading || !email || !password}
      class="mt-4 bg-text-primary text-bg font-semibold py-2 rounded-md hover:opacity-90 disabled:opacity-50 transition-opacity"
    >
      {#if loading}
        Loading...
      {:else if isSignUp}
        Sign Up
      {:else}
        Log In
      {/if}
    </button>

    <div class="text-center mt-4">
      <button 
        class="text-text-secondary text-sm hover:text-text-primary transition-colors cursor-pointer bg-transparent border-none"
        on:click={() => { isSignUp = !isSignUp; errorMsg = ''; }}
      >
        {isSignUp ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
      </button>
    </div>
  </div>
</div>

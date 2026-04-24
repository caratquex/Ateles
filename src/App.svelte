<script>
  import P5Canvas from './P5Canvas.svelte';
  import Home from './Home.svelte';
  import JournalInput from './JournalInput.svelte';
  import JournalView from './JournalView.svelte';
  import { appState } from './store.js';
</script>

<main>
  <P5Canvas />
  
  {#if $appState === 'home'}
    <Home />
  {:else if $appState === 'journal_input'}
    <JournalInput />
  {:else if $appState === 'journal_view'}
    <JournalView />
  {/if}
</main>

<style>
  main {
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    position: relative;
  }
</style>

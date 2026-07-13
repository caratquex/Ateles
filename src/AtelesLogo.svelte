<script>
  export let className = "";
</script>

<svg
  class={className}
  viewBox="0 0 198 198"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
>
  <rect
    class="dot inner"
    x="57.0742"
    y="57.0723"
    width="27.286"
    height="27.286"
    rx="13.643"
    fill="currentColor"
  />
  <rect
    class="dot inner"
    x="57.0742"
    y="85.3574"
    width="27.286"
    height="27.286"
    rx="13.643"
    fill="currentColor"
  />
  <rect
    class="dot outer"
    x="28.7876"
    y="28.7849"
    width="27.286"
    height="27.286"
    rx="13.643"
    fill="currentColor"
  />
  <rect
    class="dot outer"
    x="141.927"
    y="28.7849"
    width="27.286"
    height="27.286"
    rx="13.643"
    fill="currentColor"
  />
  <rect
    class="dot outer"
    x="28.7876"
    y="141.929"
    width="27.286"
    height="27.286"
    rx="13.643"
    fill="currentColor"
  />
  <rect
    class="dot outer"
    x="141.927"
    y="141.929"
    width="27.286"
    height="27.286"
    rx="13.643"
    fill="currentColor"
  />
  <rect
    class="dot inner"
    x="57.0742"
    y="113.645"
    width="27.286"
    height="27.286"
    rx="13.643"
    fill="currentColor"
  />
  <rect
    class="dot inner"
    x="85.3618"
    y="57.0723"
    width="27.286"
    height="27.286"
    rx="13.643"
    fill="currentColor"
  />
  <rect
    class="dot inner"
    x="113.641"
    y="57.0723"
    width="27.286"
    height="27.286"
    rx="13.643"
    fill="currentColor"
  />
  <rect
    class="dot inner"
    x="85.3618"
    y="113.645"
    width="27.286"
    height="27.286"
    rx="13.643"
    fill="currentColor"
  />
  <rect
    class="dot inner"
    x="113.641"
    y="113.645"
    width="27.286"
    height="27.286"
    rx="13.643"
    fill="currentColor"
  />
  <rect
    class="dot inner"
    x="116.001"
    y="83.0007"
    width="27.286"
    height="27.286"
    rx="13.643"
    fill="currentColor"
  />
  <rect
    class="dot outer"
    x="85.3618"
    y="0.5"
    width="27.286"
    height="55.572"
    rx="13.643"
    fill="currentColor"
  />
  <rect
    class="dot outer"
    x="85.3618"
    y="141.929"
    width="27.286"
    height="55.572"
    rx="13.643"
    fill="currentColor"
  />

  <g transform="rotate(-90 0.5 112.645)">
    <rect
      class="dot outer"
      x="0.5"
      y="112.645"
      width="27.286"
      height="55.572"
      rx="13.643"
      fill="currentColor"
    />
  </g>
  <g transform="rotate(-90 141.927 112.645)">
    <rect
      class="dot outer"
      x="141.927"
      y="112.645"
      width="27.286"
      height="55.572"
      rx="13.643"
      fill="currentColor"
    />
  </g>
</svg>

<style>
  @keyframes innerBreath {
    0%,
    100% {
      transform: scale(0.7);
    }
    50% {
      transform: scale(1);
    }
  }
  @keyframes outerBreath {
    0%,
    100% {
      transform: scale(0.7);
    }
    50% {
      transform: scale(1);
    }
  }

  .dot {
    transform-box: fill-box;
    transform-origin: center;
  }
  .inner {
    animation: innerBreath 4s ease-in-out infinite;
  }
  .outer {
    animation: outerBreath 4s ease-in-out infinite;
    animation-delay: 1s; /* Out of sync with inner */
  }
</style>

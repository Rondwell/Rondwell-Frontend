<script lang="ts">
  import { cn } from '$lib/utils/cn';

  interface Props {
    variant?: 'default' | 'ghost' | 'outline';
    size?: 'default' | 'sm' | 'lg';
    class?: string;
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
    children?: any;
  }

  let {
    variant = 'default',
    size = 'default',
    class: className = '',
    disabled = false,
    type = 'button',
    children,
    ...rest
  }: Props = $props();

  const baseClasses = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

  const variants = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
    outline: 'border border-input hover:bg-accent hover:text-accent-foreground'
  };

  const sizes = {
    default: 'h-10 py-2 px-4',
    sm: 'h-9 px-3 rounded-md',
    lg: 'h-11 px-8 rounded-md'
  };

  const classes = cn(
    baseClasses,
    variants[variant],
    sizes[size],
    className
  );
</script>

<button
  {type}
  {disabled}
  class={classes}
  {...rest}
>
  {@render children?.()}
</button>
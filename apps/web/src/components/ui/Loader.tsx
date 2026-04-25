export function Loader({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }[size];
  return (
    <div className="flex items-center justify-center py-10">
      <div className={`${sizeClass} border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin`} />
    </div>
  );
}

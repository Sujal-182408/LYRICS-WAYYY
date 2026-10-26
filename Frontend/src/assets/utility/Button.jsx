export const Button = ({
  className = " ",
  size = "default",
  children,
  ...props
}) => {
  const baseClasses =
"glass rounded-full text-white/50 hover:bg-[#000] hover:text-white shadow-sm shadow-cyan-400 transition-all  focus:outline-none focus-visible:ring-2 focus-visiblie:ring-[#20b2a6]"
  const sizeClasses = {
    sm: "px-4 py-2 text-sm",
    default: "px-6 py-3 text-base",
    lg: "px=8 py-4 text-lg",
  };

  const classes = `${baseClasses} ${sizeClasses[size]} ${className}`;
  return (
    <button className={classes} {...props}>
      <span className="relative  cursor-pointer  flex items-center justify-center gap-2">
        {children}
      </span>
    </button>
  );
};

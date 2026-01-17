"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { forwardRef } from "react";

import { cn } from "@/lib/utils";

type Href = string;

interface NavLinkCompatProps extends React.ComponentPropsWithoutRef<typeof Link> {
  href: Href;
  className?: string;
  activeClassName?: string;
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ className, activeClassName, href, ...props }, ref) => {
    const pathname = usePathname();
    const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));

    return (
      <Link
        ref={ref}
        href={href}
        className={cn(className, isActive && activeClassName)}
        {...props}
      />
    );
  },
);

NavLink.displayName = "NavLink";

export { NavLink };

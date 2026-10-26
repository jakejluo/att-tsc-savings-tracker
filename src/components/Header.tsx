import { ReactNode } from "react";

export default function Header({ children }: { children?: ReactNode }) {
  return (
    <header className="header">
      <div className="wordmark">
        <span className="brand">AT&amp;T TSC</span>
        <span className="product">Savings Tracker</span>
      </div>
      <div className="header-right">
        {children}
        <span className="synthetic">Synthetic demo data</span>
      </div>
    </header>
  );
}

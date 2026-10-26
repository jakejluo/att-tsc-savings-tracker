import { FormEvent, useState } from "react";
import { CATEGORIES, Category } from "../types";

export interface NewEvent {
  supplier: string;
  category: Category;
  baselinePrice: number;
  negotiatedPrice: number;
  date: string;
}

export default function LogForm({ onSubmit, error }: { onSubmit: (e: NewEvent) => void; error?: string }) {
  const [supplier, setSupplier] = useState("");
  const [category, setCategory] = useState<Category>("Network Equipment");
  const [baseline, setBaseline] = useState("");
  const [negotiated, setNegotiated] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  function submit(e: FormEvent) {
    e.preventDefault();
    onSubmit({
      supplier,
      category,
      baselinePrice: Number(baseline),
      negotiatedPrice: Number(negotiated),
      date,
    });
    setSupplier("");
    setBaseline("");
    setNegotiated("");
  }

  return (
    <form className="card form" onSubmit={submit} aria-label="Log savings">
      <h2>Log savings</h2>
      <label>
        Supplier
        <input value={supplier} onChange={(e) => setSupplier(e.target.value)} />
      </label>
      <label>
        Category
        <select value={category} onChange={(e) => setCategory(e.target.value as Category)}>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>
      <label>
        Baseline price
        <input value={baseline} onChange={(e) => setBaseline(e.target.value)} inputMode="decimal" />
      </label>
      <label>
        Negotiated price
        <input value={negotiated} onChange={(e) => setNegotiated(e.target.value)} inputMode="decimal" />
      </label>
      <label>
        Date
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </label>
      {error && <p className="error" role="alert">{error}</p>}
      <button type="submit" className="primary">Log savings</button>
    </form>
  );
}

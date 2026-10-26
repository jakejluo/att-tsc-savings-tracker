import { useState } from "react";
import Header from "./components/Header";
import LogForm, { NewEvent } from "./components/LogForm";
import CategoryChart from "./components/CategoryChart";
import EventsTable from "./components/EventsTable";
import { loadEvents, saveEvents } from "./store";
import { SavingsEvent, savingsOf } from "./types";
import { usd } from "./format";

export default function App() {
  const [events, setEvents] = useState<SavingsEvent[]>(loadEvents);

  function update(next: SavingsEvent[]) {
    setEvents(next);
    saveEvents(next);
  }

  function add(e: NewEvent) {
    const id = Math.max(0, ...events.map((x) => x.id)) + 1;
    update([{ ...e, id, status: "pending" }, ...events]);
  }

  function approve(id: number) {
    update(events.map((e) => (e.id === id ? { ...e, status: "approved" } : e)));
  }

  const total = events.reduce((s, e) => s + savingsOf(e), 0);
  const sorted = [...events].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <>
      <Header />
      <main className="layout">
        <LogForm onSubmit={add} />
        <section className="dashboard">
          <div className="kpis">
            <div className="card kpi">
              <span className="kpi-label">Total savings</span>
              <span className="kpi-value" data-testid="total-savings">{usd(total)}</span>
            </div>
            <div className="card kpi">
              <span className="kpi-label">Events logged</span>
              <span className="kpi-value">{events.length}</span>
            </div>
          </div>
          <CategoryChart events={events} />
          <EventsTable events={sorted} canApprove={() => true} onApprove={approve} />
        </section>
      </main>
    </>
  );
}

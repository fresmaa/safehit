import "../styles/tailwind.css";
import { initMockingEngine } from "./mocking";
import { initApiClient } from "./api-client";

document.addEventListener("DOMContentLoaded", () => {
  const navMocking = document.getElementById("nav-mocking") as HTMLButtonElement;
  const navClient = document.getElementById("nav-client") as HTMLButtonElement;
  const viewMocking = document.getElementById("view-mocking") as HTMLDivElement;
  const viewClient = document.getElementById("view-client") as HTMLDivElement;

  const mocking = initMockingEngine();
  const client = initApiClient();

  const switchView = (view: "mocking" | "client") => {
    if (view === "mocking") {
      navMocking.className =
        "nav-btn w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold bg-white/10 text-white transition-all";
      navClient.className =
        "nav-btn w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-zinc-400 hover:bg-white/5 hover:text-white transition-all";
      viewMocking.classList.remove("hidden");
      viewClient.classList.add("hidden");
    } else {
      navClient.className =
        "nav-btn w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold bg-white/10 text-white transition-all";
      navMocking.className =
        "nav-btn w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-zinc-400 hover:bg-white/5 hover:text-white transition-all";
      viewClient.classList.remove("hidden");
      viewClient.classList.add("flex");
      viewMocking.classList.add("hidden");
    }
  };

  navMocking.addEventListener("click", () => switchView("mocking"));

  navClient.addEventListener("click", () => {
    switchView("client");
    client.refreshTabsList();
  });

  document.addEventListener("click", (e) => {
    if (
      !mocking.methodTrigger.contains(e.target as Node) &&
      !mocking.methodDropdown.contains(e.target as Node)
    ) {
      mocking.methodDropdown.classList.add("hidden");
      mocking.methodArrow.classList.remove("rotate-180");
    }
    if (
      !client.clientTabTrigger.contains(e.target as Node) &&
      !client.clientTabDropdown.contains(e.target as Node)
    ) {
      client.clientTabDropdown.classList.add("hidden");
      client.clientTabArrow.classList.remove("rotate-180");
    }
  });

  mocking.renderMocks();
});

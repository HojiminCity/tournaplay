export async function fetchData() {
  try {
    const res = await fetch("/api/data");
    if (!res.ok) throw new Error("Network response was not ok");
    return await res.json();
  } catch (err) {
    console.error("Failed to fetch data:", err);
    throw err;
  }
}

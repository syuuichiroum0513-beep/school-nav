export function buildGraph(nodes, edges) {
  const graph = new Map(nodes.map(node => [node.id, []]));
  for (const edge of edges) {
    if (!graph.has(edge.from) || !graph.has(edge.to)) continue;
    graph.get(edge.from).push(edge);
    graph.get(edge.to).push({ ...edge, from: edge.to, to: edge.from });
  }
  return graph;
}

// 重み付き最短経路を求めるダイクストラ法。
export function dijkstra(graph, startId, goalId) {
  if (!graph.has(startId) || !graph.has(goalId)) return [];

  const distances = new Map();
  const previous = new Map();
  const unvisited = new Set(graph.keys());

  for (const id of graph.keys()) distances.set(id, Infinity);
  distances.set(startId, 0);

  while (unvisited.size > 0) {
    let current = null;
    let bestDistance = Infinity;

    for (const id of unvisited) {
      const distance = distances.get(id);
      if (distance < bestDistance) {
        bestDistance = distance;
        current = id;
      }
    }

    if (current === null) break;
    if (current === goalId) break;
    unvisited.delete(current);

    for (const edge of graph.get(current)) {
      if (!unvisited.has(edge.to)) continue;
      const nextDistance = bestDistance + Number(edge.cost ?? 1);
      if (nextDistance < distances.get(edge.to)) {
        distances.set(edge.to, nextDistance);
        previous.set(edge.to, { nodeId: current, edge });
      }
    }
  }

  if (startId !== goalId && !previous.has(goalId)) return [];

  const path = [];
  let current = goalId;
  while (current !== startId) {
    const step = previous.get(current);
    if (!step) return [];
    path.unshift(step.edge);
    current = step.nodeId;
  }
  return path;
}

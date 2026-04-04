export function echoHandler(req: any) {
  return Response.json({ 
    method: "GET", 
    echo: req.params.message,
    status: "Handled by separate chunk (Lazy Loaded)"
  });
}

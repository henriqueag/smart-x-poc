var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.MapStaticAssets();
app.UseStaticFiles();

app.MapGet("/", () => Results.Redirect("/index.html"));

await app.RunAsync();

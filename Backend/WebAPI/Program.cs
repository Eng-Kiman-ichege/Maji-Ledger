using MajiLedger.Infrastructure.DependencyInjection;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// ────────────────────────────────────────────
// 1.  Infrastructure (EF Core, repositories)
// ────────────────────────────────────────────
builder.Services.AddInfrastructure(builder.Configuration);

// ────────────────────────────────────────────
// 2.  API layer
// ────────────────────────────────────────────
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// ────────────────────────────────────────────
// 3.  Swagger / OpenAPI
// ────────────────────────────────────────────
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title       = "Maji Ledger API",
        Version     = "v1",
        Description = "Prepaid water billing and property management platform.",
        Contact     = new OpenApiContact { Name = "Maji Ledger" }
    });
});

// ────────────────────────────────────────────
// 4.  Health checks
// ────────────────────────────────────────────
builder.Services.AddHealthChecks();

// ────────────────────────────────────────────
// 5.  CORS  (tighten in production)
// ────────────────────────────────────────────
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        var origins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
                      ?? ["http://localhost:3000"];
        policy.WithOrigins(origins)
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// ════════════════════════════════════════════
var app = builder.Build();
// ════════════════════════════════════════════

// ────────────────────────────────────────────
// 6.  Middleware pipeline
// ────────────────────────────────────────────
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Maji Ledger API v1");
        c.RoutePrefix = "swagger";
    });
}

app.UseHttpsRedirection();
app.UseCors("AllowFrontend");
app.UseAuthorization();
app.MapControllers();

// ────────────────────────────────────────────
// 7.  Health-check endpoint (no DB yet)
// ────────────────────────────────────────────
app.MapHealthChecks("/health");

app.MapGet("/", () => Results.Redirect("/swagger")).ExcludeFromDescription();

app.Run();

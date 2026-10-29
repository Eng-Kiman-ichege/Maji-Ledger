using System.Text;
using MajiLedger.Application;
using MajiLedger.Infrastructure.DependencyInjection;
using MajiLedger.WebAPI.Middleware;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;

var builder = WebApplication.CreateBuilder(args);

// ────────────────────────────────────────────
// 1.  Application (MediatR, validators)
// ────────────────────────────────────────────
builder.Services.AddApplication();

// ────────────────────────────────────────────
// 2.  Infrastructure (EF Core, repositories)
// ────────────────────────────────────────────
builder.Services.AddInfrastructure(builder.Configuration);

// Override Infrastructure's placeholder CurrentUserService with the
// HTTP-context-aware one that reads claims from the JWT token.
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<MajiLedger.Application.Common.Interfaces.ICurrentUserService,
    MajiLedger.WebAPI.Services.CurrentUserService>();

// ────────────────────────────────────────────
// 3.  Authentication & JWT
// ────────────────────────────────────────────
var secret = builder.Configuration["Jwt:Secret"] 
             ?? "MajiLedgerSecureKey2026_SuperSecretKeyForJwtTokenGeneration_WaterMeteringSystem!";
var issuer = builder.Configuration["Jwt:Issuer"] ?? "MajiLedger";
var audience = builder.Configuration["Jwt:Audience"] ?? "MajiLedgerClients";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret)),
        ValidateIssuer = true,
        ValidIssuer = issuer,
        ValidateAudience = true,
        ValidAudience = audience,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

// ────────────────────────────────────────────
// 4.  API layer
// ────────────────────────────────────────────
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });
builder.Services.AddEndpointsApiExplorer();

// ────────────────────────────────────────────
// 5.  Swagger / OpenAPI
// ────────────────────────────────────────────
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title       = "Maji Ledger API",
        Version     = "v1",
        Description = "Prepaid water billing and property management platform with Role-Based Access.",
        Contact     = new OpenApiContact { Name = "Maji Ledger" }
    });
});

// ────────────────────────────────────────────
// 6.  Health checks
// ────────────────────────────────────────────
builder.Services.AddHealthChecks();

// ────────────────────────────────────────────
// 7.  CORS (tighten in production)
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
// 8.  Middleware pipeline
// ────────────────────────────────────────────
app.UseMiddleware<ExceptionHandlingMiddleware>();

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

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// ────────────────────────────────────────────
// 9.  Health-check endpoint
// ────────────────────────────────────────────
app.MapHealthChecks("/health");

app.MapGet("/", () => Results.Redirect("/swagger")).ExcludeFromDescription();

// ────────────────────────────────────────────
// 10. Seed Default Admin if none exists
// ────────────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    try
    {
        var sender = scope.ServiceProvider.GetRequiredService<ISender>();
        await sender.Send(new MajiLedger.Application.Features.Auth.SeedDefaultAdminCommand());
        await sender.Send(new MajiLedger.Application.Features.Auth.SeedDemoDataCommand());
    }
    catch (Exception ex)
    {
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        logger.LogWarning(ex, "Could not run initial default admin seed: {Message}", ex.Message);
    }
}

app.Run();

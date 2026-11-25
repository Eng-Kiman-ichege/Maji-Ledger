using System.Text;
using MajiLedger.Application;
using MajiLedger.Application.Common.Security;
using MajiLedger.Infrastructure.DependencyInjection;
using MajiLedger.WebAPI.Authorization;
using MajiLedger.WebAPI.Middleware;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
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
             ?? builder.Configuration["JwtSettings:Secret"]
             ?? "PropertyLedger_DefaultSecureDevelopmentSecretKey_MustBeAtLeast32BytesLong!";
var issuer = builder.Configuration["Jwt:Issuer"] ?? builder.Configuration["JwtSettings:Issuer"] ?? "PropertyLedger";
var audience = builder.Configuration["Jwt:Audience"] ?? builder.Configuration["JwtSettings:Audience"] ?? "PropertyLedgerClients";

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
// 4.  Authorization & Policies
// ────────────────────────────────────────────
builder.Services.AddScoped<IAuthorizationHandler, PermissionAuthorizationHandler>();
builder.Services.AddScoped<IAuthorizationHandler, ModuleAccessAuthorizationHandler>();

builder.Services.AddAuthorization(options =>
{
    // Policies for Modules
    options.AddPolicy($"Module:{AppModules.PropertyManagement}", policy =>
        policy.Requirements.Add(new ModuleAccessRequirement(AppModules.PropertyManagement)));

    options.AddPolicy($"Module:{AppModules.WaterLedger}", policy =>
        policy.Requirements.Add(new ModuleAccessRequirement(AppModules.WaterLedger)));

    options.AddPolicy($"Module:{AppModules.PlatformAdmin}", policy =>
        policy.Requirements.Add(new ModuleAccessRequirement(AppModules.PlatformAdmin)));

    // Policies for Roles
    options.AddPolicy("RequireAdmin", policy => policy.RequireRole("Admin"));
    options.AddPolicy("RequireLandlord", policy => policy.RequireRole("Admin", "Owner"));
});

// ────────────────────────────────────────────
// 5.  API layer
// ────────────────────────────────────────────
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });
builder.Services.AddEndpointsApiExplorer();

// ────────────────────────────────────────────
// 6.  Swagger / OpenAPI with JWT Bearer
// ────────────────────────────────────────────
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title       = "PropertyLedger API",
        Version     = "v1",
        Description = "Unified Property Management and Water Ledger Platform API.",
        Contact     = new OpenApiContact { Name = "PropertyLedger" }
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter JWT Bearer token: Bearer {your token}"
    });

    options.AddSecurityRequirement(_ => new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecuritySchemeReference("Bearer"),
            new List<string>()
        }
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
        policy.SetIsOriginAllowed(_ => true)
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

app.UseCors("AllowFrontend");
app.UseHttpsRedirection();

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

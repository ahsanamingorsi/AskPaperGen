using AskPaperGen.Data;
using AskPaperGen.Models;
using AskPaperGen.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);


// ── DB CONTEXT (keep only ONE connection source) ───────────
builder.Services.AddDbContext<ApplicationDbContext>(o =>
    o.UseSqlServer(builder.Configuration.GetConnectionString("conString")));

builder.Services.AddIdentity<ApplicationUser, IdentityRole>(o => {
    o.Password.RequireDigit = true; o.Password.RequiredLength = 6;
    o.Password.RequireNonAlphanumeric = false; o.Password.RequireUppercase = true;
    o.Lockout.MaxFailedAccessAttempts = 5; o.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
    o.SignIn.RequireConfirmedEmail = false;
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders();

builder.Services.ConfigureApplicationCookie(o => {
    o.LoginPath = "/Auth/Login"; o.LogoutPath = "/Auth/Logout";
    o.AccessDeniedPath = "/Auth/AccessDenied";
    o.ExpireTimeSpan = TimeSpan.FromDays(14); o.SlidingExpiration = true;
});

builder.Services.AddScoped<ITemplateService, TemplateService>();
builder.Services.AddScoped<IPdfService, PdfService>();
builder.Services.AddScoped<ISiteSettingsService, SiteSettingsService>();

builder.Services.AddControllersWithViews()
    .AddNewtonsoftJson(o => o.SerializerSettings.ContractResolver =
        new Newtonsoft.Json.Serialization.CamelCasePropertyNamesContractResolver());

var app = builder.Build();

if (!app.Environment.IsDevelopment()) { app.UseExceptionHandler("/Home/Error"); app.UseHsts(); }
app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllerRoute("default", "{controller=Home}/{action=Index}/{id?}");
app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    try
    {
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        await db.Database.MigrateAsync();
        await DatabaseSeeder.SeedAsync(scope.ServiceProvider);
    }
    catch (Exception ex)
    {
        scope.ServiceProvider.GetRequiredService<ILogger<Program>>().LogError(ex, "Seed failed.");
    }
}
app.Run();

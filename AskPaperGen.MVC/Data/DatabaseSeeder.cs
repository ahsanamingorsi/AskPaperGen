using Microsoft.AspNetCore.Identity;
using AskPaperGen.Models;
using AskPaperGen.Models.Schema;
using Newtonsoft.Json;
using Microsoft.EntityFrameworkCore;

namespace AskPaperGen.Data;

public static class DatabaseSeeder
{
    public static async Task SeedAsync(IServiceProvider svc)
    {
        var um  = svc.GetRequiredService<UserManager<ApplicationUser>>();
        var rm  = svc.GetRequiredService<RoleManager<IdentityRole>>();
        var db  = svc.GetRequiredService<ApplicationDbContext>();
        var cfg = svc.GetRequiredService<IConfiguration>();

        foreach (var role in new[] { "Admin", "User" })
            if (!await rm.RoleExistsAsync(role))
                await rm.CreateAsync(new IdentityRole(role));

        var adminEmail = cfg["AppSettings:AdminEmail"] ?? "admin@askpapergen.com";
        var adminPwd   = cfg["AppSettings:AdminPassword"] ?? "Admin@123456";
        if (await um.FindByEmailAsync(adminEmail) is null)
        {
            var admin = new ApplicationUser { FullName="System Admin", UserName=adminEmail, Email=adminEmail, EmailConfirmed=true, Institution="AskPaperGen" };
            var r = await um.CreateAsync(admin, adminPwd);
            if (r.Succeeded) await um.AddToRoleAsync(admin, "Admin");
        }

        const string demoEmail = "demo@askpapergen.com";
        var demo = await um.FindByEmailAsync(demoEmail);
        if (demo is null)
        {
            demo = new ApplicationUser { FullName="Demo Teacher", UserName=demoEmail, Email=demoEmail, EmailConfirmed=true, Institution="Greenfield Academy" };
            var r = await um.CreateAsync(demo, "Demo@123456");
            if (r.Succeeded) await um.AddToRoleAsync(demo, "User");
        }

        if (!db.Templates.IgnoreQueryFilters().Any(t => t.IsBuiltIn))
        {
            db.Templates.AddRange(BuildTemplates(demo?.Id ?? ""));
            await db.SaveChangesAsync();
        }
    }

    private static List<PaperTemplate> BuildTemplates(string userId)
    {
        TemplateSettings Sett(string primary, string header, string section, string font, bool rtl,
            string[] instrs, SectionPreset[] presets, List<string>? headerElements = null) => new()
        {
            PrimaryColor = primary, HeaderStyle = header, SectionStyle = section,
            FontFamily = font, Rtl = rtl, ShowLogo=true, ShowAnswerLines=true,
            ShowMarks=true, ShowPageNums=true, ShowInstructions=true,
            DefaultInstructions = instrs.ToList(), SectionPresets = presets.ToList(),
            HeaderElements = headerElements ?? ["logo","institute","affiliation","department","examBand","subject","meta","divider","nameRow"]
        };

        var enInstrs = new[]{ "All questions are compulsory unless otherwise stated.", "Write legibly in the space provided.", "Mobile phones are not allowed." };
        var urInstrs = new[]{ "تمام سوالات لازمی ہیں۔", "صاف اور خوانہ تحریر لکھیں۔", "موبائل فون ممنوع ہے۔" };

        var stdPresets = new SectionPreset[]{
            new(){ Title="Section A – MCQs", Instructions="Choose the correct answer.", AttemptRule="Attempt all", DefaultMarks=1, QuestionType="mcq" },
            new(){ Title="Section B – Short Questions", Instructions="Answer any 5. Each carries 5 marks.", AttemptRule="Attempt any 5", DefaultMarks=5, QuestionType="short" },
            new(){ Title="Section C – Long Questions", Instructions="Attempt any 3. Each carries 10 marks.", AttemptRule="Attempt any 3", DefaultMarks=10, QuestionType="long" }
        };
        var urPresets = new SectionPreset[]{
            new(){ Title="حصہ الف – کثیر انتخابی", Instructions="درست جواب کا انتخاب کریں۔", AttemptRule="تمام سوالات", DefaultMarks=1, QuestionType="mcq" },
            new(){ Title="حصہ ب – مختصر سوالات", Instructions="کوئی پانچ سوال حل کریں۔", AttemptRule="کوئی پانچ", DefaultMarks=5, QuestionType="short" },
            new(){ Title="حصہ ج – تفصیلی سوالات", Instructions="کوئی تین سوال حل کریں۔", AttemptRule="کوئی تین", DefaultMarks=10, QuestionType="long" }
        };

        string J(TemplateSettings s) => JsonConvert.SerializeObject(s);

        return [
            new(){ Name="Standard English",     Description="Classic 3-section English exam.",          Category="English", Language="English", ThumbnailClass="tmpl-en",   IsBuiltIn=true, IsPublic=true, UserId=userId, SettingsJson=J(Sett("#1e3a8a","band","sidebar","times",false,enInstrs,stdPresets)) },
            new(){ Name="Urdu Medium",           Description="Complete Urdu RTL exam with Nastaliq.",    Category="Urdu",    Language="Urdu",    ThumbnailClass="tmpl-ur",   IsBuiltIn=true, IsPublic=true, UserId=userId, SettingsJson=J(Sett("#7c2d12","band","sidebar","urdu",true, urInstrs,urPresets,["institute","affiliation","department","examBand","subject","meta","divider","nameRow"])) },
            new(){ Name="Science & Biology",     Description="Green theme for science subjects.",         Category="Science", Language="English", ThumbnailClass="tmpl-sci",  IsBuiltIn=true, IsPublic=true, UserId=userId, SettingsJson=J(Sett("#166534","band","sidebar","times",false,enInstrs,stdPresets)) },
            new(){ Name="Mathematics",           Description="Orange theme for math exams.",             Category="Math",    Language="English", ThumbnailClass="tmpl-math", IsBuiltIn=true, IsPublic=true, UserId=userId, SettingsJson=J(Sett("#9a3412","band","underline","times",false,enInstrs,stdPresets)) },
            new(){ Name="Minimal / Custom",      Description="Blank slate – configure everything.",      Category="Custom",  Language="English", ThumbnailClass="tmpl-custom",IsBuiltIn=true, IsPublic=true, UserId=userId, SettingsJson=J(Sett("#374151","minimal","sidebar","arial",false,enInstrs,[])) },
        ];
    }
}

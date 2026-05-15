using AskPaperGen.Data;
using AskPaperGen.Models;
using AskPaperGen.ViewModels;
using Microsoft.EntityFrameworkCore;

namespace AskPaperGen.Services;

public interface ITemplateService {
    Task<List<TemplateListItem>> GetAllPublicAsync();
    Task<List<TemplateListItem>> GetUserTemplatesAsync(string userId);
    Task<List<TemplateListItem>> GetAllAdminAsync();
    Task<PaperTemplate?> GetAsync(int id);
    Task<int>  CreateAsync(string userId, string name, string? desc, string? cat, string? subject, string? lang, bool isPublic, string settingsJson);
    Task<bool> UpdateAsync(int id, string adminId, string name, string? desc, string? cat, string? subject, string? lang, bool isPublic, string settingsJson);
    Task<bool> DeleteAsync(int id);
}
public class TemplateService(ApplicationDbContext db) : ITemplateService {
    public Task<List<TemplateListItem>> GetAllPublicAsync() =>
        db.Templates.Where(t => t.IsPublic).Include(t=>t.User)
          .OrderBy(t=>t.IsBuiltIn?0:1).ThenByDescending(t=>t.CreatedAt)
          .Select(t=>Map(t)).ToListAsync();

    public Task<List<TemplateListItem>> GetUserTemplatesAsync(string userId) =>
        db.Templates.Where(t=>t.UserId==userId).Include(t=>t.User)
          .OrderByDescending(t=>t.CreatedAt).Select(t=>Map(t)).ToListAsync();

    public Task<List<TemplateListItem>> GetAllAdminAsync() =>
        db.Templates.IgnoreQueryFilters().Include(t=>t.User)
          .OrderBy(t=>t.IsBuiltIn?0:1).ThenByDescending(t=>t.CreatedAt)
          .Select(t=>Map(t)).ToListAsync();

    public Task<PaperTemplate?> GetAsync(int id) =>
        db.Templates.IgnoreQueryFilters().FirstOrDefaultAsync(t=>t.Id==id);

    public async Task<int> CreateAsync(string userId, string name, string? desc, string? cat, string? subject, string? lang, bool isPublic, string settingsJson) {
        var thumb = cat switch { "Urdu"=>"tmpl-ur","Science"=>"tmpl-sci","Math"=>"tmpl-math","Custom"=>"tmpl-custom",_=>"tmpl-en" };
        var t = new PaperTemplate { UserId=userId, Name=name, Description=desc, Category=cat, Subject=subject, Language=lang, IsPublic=isPublic, ThumbnailClass=thumb, SettingsJson=settingsJson };
        db.Templates.Add(t); await db.SaveChangesAsync(); return t.Id;
    }

    public async Task<bool> UpdateAsync(int id, string adminId, string name, string? desc, string? cat, string? subject, string? lang, bool isPublic, string settingsJson) {
        var t = await db.Templates.IgnoreQueryFilters().FirstOrDefaultAsync(t=>t.Id==id);
        if (t is null) return false;
        t.Name=name; t.Description=desc; t.Category=cat; t.Subject=subject; t.Language=lang;
        t.IsPublic=isPublic; t.SettingsJson=settingsJson;
        t.ThumbnailClass = cat switch { "Urdu"=>"tmpl-ur","Science"=>"tmpl-sci","Math"=>"tmpl-math","Custom"=>"tmpl-custom",_=>"tmpl-en" };
        await db.SaveChangesAsync(); return true;
    }

    public async Task<bool> DeleteAsync(int id) {
        var t = await db.Templates.IgnoreQueryFilters().FirstOrDefaultAsync(t=>t.Id==id);
        if (t is null) return false;
        t.IsDeleted=true; await db.SaveChangesAsync(); return true;
    }

    private static TemplateListItem Map(PaperTemplate t) => new() {
        Id=t.Id, Name=t.Name, Description=t.Description, Category=t.Category,
        Language=t.Language, ThumbnailClass=t.ThumbnailClass,
        IsBuiltIn=t.IsBuiltIn, IsPublic=t.IsPublic,
        OwnerName=t.User?.FullName, CreatedAt=t.CreatedAt
    };
}

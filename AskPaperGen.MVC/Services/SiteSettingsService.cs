using AskPaperGen.Data;
using AskPaperGen.Models;
using Microsoft.EntityFrameworkCore;

namespace AskPaperGen.Services;

public interface ISiteSettingsService {
    Task<SiteSettings> GetAsync();
    Task SaveAsync(SiteSettings s);
}
public class SiteSettingsService(ApplicationDbContext db) : ISiteSettingsService {
    public async Task<SiteSettings> GetAsync() {
        var s = await db.SiteSettings.FirstOrDefaultAsync();
        if (s is null) { s=new SiteSettings(); db.SiteSettings.Add(s); await db.SaveChangesAsync(); }
        return s;
    }
    public async Task SaveAsync(SiteSettings s) { db.SiteSettings.Update(s); await db.SaveChangesAsync(); }
}

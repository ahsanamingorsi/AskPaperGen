using AskPaperGen.Data;
using AskPaperGen.Models;
using AskPaperGen.Services;
using AskPaperGen.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AskPaperGen.Controllers;

[Authorize(Roles="Admin")]
public class AdminController(
    UserManager<ApplicationUser> um,
    ITemplateService tmplSvc,
    ISiteSettingsService siteSvc) : Controller
{
    public async Task<IActionResult> Index()
    {
        var users = await um.Users.ToListAsync();
        var tmpls = await tmplSvc.GetAllAdminAsync();
        var sett  = await siteSvc.GetAsync();
        return View(new AdminDashVm {
            TotalUsers=users.Count, TotalTemplates=tmpls.Count,
            ActiveUsers=users.Count(u=>u.IsActive),
            SaveDisabled=sett.PaperSavingDisabled,
            SaveDisabledMsg=sett.PaperSavingDisabledMessage,
            RecentUsers=users.OrderByDescending(u=>u.CreatedAt).Take(5)
                .Select(u=>new UserListItem { Id=u.Id,FullName=u.FullName,Email=u.Email??"—",
                    Institution=u.Institution,IsActive=u.IsActive,
                    CreatedAt=u.CreatedAt,Initials=u.AvatarInitials }).ToList()
        });
    }

    public async Task<IActionResult> Settings() => View(await siteSvc.GetAsync());

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> SaveSettings(SiteSettings m)
    {
        var s = await siteSvc.GetAsync();
        s.PaperSavingDisabled = m.PaperSavingDisabled;
        s.PaperSavingDisabledMessage = m.PaperSavingDisabledMessage ?? s.PaperSavingDisabledMessage;
        await siteSvc.SaveAsync(s);
        TempData["Success"] = "Settings saved.";
        return RedirectToAction("Settings");
    }

    public async Task<IActionResult> Users()
    {
        var users = await um.Users.OrderByDescending(u=>u.CreatedAt).ToListAsync();
        return View(users.Select(u => new UserListItem {
            Id=u.Id, FullName=u.FullName, Email=u.Email??"—",
            Institution=u.Institution, IsActive=u.IsActive,
            CreatedAt=u.CreatedAt, Initials=u.AvatarInitials
        }).ToList());
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> ToggleUser(string id)
    {
        var u = await um.FindByIdAsync(id); if (u is null) return NotFound();
        u.IsActive = !u.IsActive; await um.UpdateAsync(u);
        TempData["Success"] = $"User {(u.IsActive?"activated":"deactivated")}.";
        return RedirectToAction("Users");
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> DeleteUser(string id)
    {
        var u = await um.FindByIdAsync(id); if (u is null) return NotFound();
        await um.DeleteAsync(u); TempData["Success"] = "User deleted.";
        return RedirectToAction("Users");
    }

    public async Task<IActionResult> Templates() => View(await tmplSvc.GetAllAdminAsync());

    public async Task<IActionResult> EditTemplate(int id)
    {
        var t = await tmplSvc.GetAsync(id); if (t is null) return NotFound();
        return View(new TemplateBuilderVm {
            Id=t.Id, Name=t.Name, Description=t.Description,
            Category=t.Category, Subject=t.Subject, Language=t.Language??"English",
            IsPublic=t.IsPublic, SettingsJson=t.SettingsJson
        });
    }

    public IActionResult NewTemplate() =>
        View("EditTemplate", new TemplateBuilderVm { Language="English", IsPublic=true, SettingsJson="{}" });

    [HttpPost]
    public async Task<IActionResult> SaveTemplateAjax([FromBody] SaveTmplReq req)
    {
        var user = await um.GetUserAsync(User); if (user is null) return Unauthorized();
        int id;
        if (req.Id > 0)
        {
            await tmplSvc.UpdateAsync(req.Id, user.Id, req.Name, req.Description,
                req.Category, req.Subject, req.Language, req.IsPublic, req.SettingsJson);
            id = req.Id;
        }
        else
        {
            id = await tmplSvc.CreateAsync(user.Id, req.Name, req.Description,
                req.Category, req.Subject, req.Language, req.IsPublic, req.SettingsJson);
        }
        return Ok(new { id, message = "Template saved." });
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> DeleteTemplate(int id)
    {
        await tmplSvc.DeleteAsync(id);
        TempData["Success"] = "Template deleted.";
        return RedirectToAction("Templates");
    }

    public async Task<IActionResult> ViewTemplateJson(int id)
    {
        var t = await tmplSvc.GetAsync(id); if (t is null) return NotFound();
        ViewBag.Name = t.Name; ViewBag.Json = t.SettingsJson;
        return View();
    }
}

public class SaveTmplReq
{
    public int     Id           { get; set; }
    public string  Name         { get; set; } = string.Empty;
    public string? Description  { get; set; }
    public string? Category     { get; set; }
    public string? Subject      { get; set; }
    public string? Language     { get; set; }
    public bool    IsPublic     { get; set; }
    public string  SettingsJson { get; set; } = "{}";
}

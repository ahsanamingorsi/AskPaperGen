using AskPaperGen.Models;
using AskPaperGen.Services;
using AskPaperGen.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace AskPaperGen.MVC.Controllers
{
    [Authorize]

    public class DashboardController(UserManager<ApplicationUser> um, ITemplateService tmplSvc, ISiteSettingsService siteSvc) : Controller
    {
        public async Task<IActionResult> Index()
        {
            var user = await um.GetUserAsync(User); if (user is null) return Challenge();
            var sett = await siteSvc.GetAsync();
            var pub = await tmplSvc.GetAllPublicAsync();
            var mine = await tmplSvc.GetUserTemplatesAsync(user.Id);
            var all = mine.UnionBy(pub, t => t.Id).ToList();
            return View(new DashboardVm
            {
                UserName = user.FullName,
                UserInitials = user.AvatarInitials,
                Institution = user.Institution,
                TotalTemplates = all.Count,
                SaveDisabled = sett.PaperSavingDisabled,
                SaveDisabledMsg = sett.PaperSavingDisabledMessage,
                AllTemplates = all
            });
        }
        public async Task<IActionResult> MyTemplates()
        {
            var user = await um.GetUserAsync(User); if (user is null) return Challenge();
            var pub = await tmplSvc.GetAllPublicAsync();
            var mine = await tmplSvc.GetUserTemplatesAsync(user.Id);
            ViewBag.PubTemplates = pub.Where(p => !mine.Any(m => m.Id == p.Id)).ToList();
            return View(mine);
        }
    }

}

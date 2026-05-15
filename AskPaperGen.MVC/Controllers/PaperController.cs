using AskPaperGen.Models;
using AskPaperGen.Models.Schema;
using AskPaperGen.Services;
using AskPaperGen.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;

namespace AskPaperGen.Controllers;

[Authorize]
public class PaperController(ITemplateService tmplSvc, IPdfService pdfSvc, ISiteSettingsService siteSvc, UserManager<ApplicationUser> um) : Controller {
    public async Task<IActionResult> Create(int? templateId=null) {
        var sett = await siteSvc.GetAsync();
        string? settJson = null;
        if (templateId.HasValue) { var t=await tmplSvc.GetAsync(templateId.Value); if(t!=null) settJson=t.SettingsJson; }
        ViewBag.TemplateId      = templateId ?? 0;
        ViewBag.TemplateJson    = settJson ?? "null";
        ViewBag.SaveDisabled    = sett.PaperSavingDisabled;
        ViewBag.SaveDisabledMsg = sett.PaperSavingDisabledMessage;
        return View("Generator");
    }
    [HttpPost]
    public IActionResult ExportPdf([FromBody] ExportRequest req) {
        PaperDocument? doc; try { doc=JsonConvert.DeserializeObject<PaperDocument>(req.PaperJson); } catch { return BadRequest(new{error="Invalid JSON"}); }
        if (doc is null) return BadRequest(new{error="Empty doc"});
        var bytes=pdfSvc.Generate(doc);
        var name=$"{(doc.Info.Subject?.Replace(" ","_") ?? "Paper")}_{DateTime.Now:yyyyMMdd}.pdf";
        return File(bytes,"application/pdf",name);
    }
    [HttpPost]
    public async Task<IActionResult> SaveAsTemplate([FromBody] SaveTemplateRequest req) {
        var user=await um.GetUserAsync(User); if(user is null) return Unauthorized();
        var id=await tmplSvc.CreateAsync(user.Id,req.Name,req.Description,req.Category,req.Subject,req.Language,req.IsPublic,req.SettingsJson);
        return Ok(new{id,message="Template saved."});
    }
}
public class ExportRequest { public string PaperJson { get; set; } = ""; }

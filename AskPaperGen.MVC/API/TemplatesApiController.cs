using AskPaperGen.Models;
using AskPaperGen.Services;
using AskPaperGen.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace AskPaperGen.API;

[ApiController, Route("api/templates"), Authorize]
public class TemplatesApiController(ITemplateService ts, UserManager<ApplicationUser> um) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<TemplateListItem>>> GetAll()
    {
        var u    = await um.GetUserAsync(User);
        var pub  = await ts.GetAllPublicAsync();
        if (u is null) return pub;
        var mine = await ts.GetUserTemplatesAsync(u.Id);
        return mine.UnionBy(pub, t => t.Id).ToList();
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult> Get(int id)
    {
        var t = await ts.GetAsync(id);
        if (t is null) return NotFound();
        return Ok(new { id = t.Id, name = t.Name, settings = t.SettingsJson });
    }
}

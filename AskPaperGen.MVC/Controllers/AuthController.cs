using AskPaperGen.Models;
using AskPaperGen.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace AskPaperGen.MVC.Controllers
{
    public class AuthController(UserManager<ApplicationUser> um, SignInManager<ApplicationUser> sm) : Controller
    {
        [HttpGet]
        public IActionResult Login(string? returnUrl = null)
        {
            if (User.Identity?.IsAuthenticated == true) return RedirectToAction("Index", "Dashboard");
            ViewData["ReturnUrl"] = returnUrl; return View();
        }
        [HttpPost, ValidateAntiForgeryToken]
        public async Task<IActionResult> Login(LoginVm m, string? returnUrl = null)
        {
            if (!ModelState.IsValid) return View(m);
            var r = await sm.PasswordSignInAsync(m.Email, m.Password, m.RememberMe, true);
            if (r.Succeeded)
            {
                var user = await um.FindByEmailAsync(m.Email);
                if (user != null) { user.LastLoginAt = DateTime.UtcNow; await um.UpdateAsync(user); }
                if (user != null && await um.IsInRoleAsync(user, "Admin")) return RedirectToAction("Index", "Admin");
                if (Url.IsLocalUrl(returnUrl)) return Redirect(returnUrl!);
                return RedirectToAction("Index", "Dashboard");
            }
            ModelState.AddModelError("", r.IsLockedOut ? "Account locked 15 min." : "Invalid email or password.");
            return View(m);
        }
        [HttpGet]
        public IActionResult Register()
        {
            if (User.Identity?.IsAuthenticated == true) return RedirectToAction("Index", "Dashboard");
            return View();
        }
        [HttpPost, ValidateAntiForgeryToken]
        public async Task<IActionResult> Register(RegisterVm m)
        {
            if (!ModelState.IsValid) return View(m);
            var user = new ApplicationUser { FullName = m.FullName, UserName = m.Email, Email = m.Email, Institution = m.Institution, EmailConfirmed = true };
            var r = await um.CreateAsync(user, m.Password);
            if (r.Succeeded) { await um.AddToRoleAsync(user, "User"); await sm.SignInAsync(user, false); return RedirectToAction("Index", "Dashboard"); }
            foreach (var e in r.Errors) ModelState.AddModelError("", e.Description);
            return View(m);
        }
        [HttpPost, Authorize, ValidateAntiForgeryToken]
        public async Task<IActionResult> Logout() { await sm.SignOutAsync(); return RedirectToAction("Index", "Home"); }
        public IActionResult AccessDenied() => View();
    }

}

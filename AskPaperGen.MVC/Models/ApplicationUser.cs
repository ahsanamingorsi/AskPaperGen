using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;

namespace AskPaperGen.Models;

public class ApplicationUser : IdentityUser
{
    [Required, MaxLength(120)] public string FullName    { get; set; } = string.Empty;
    [MaxLength(200)]           public string? Institution { get; set; }
    [MaxLength(100)]           public string? Department  { get; set; }

    public string? AvatarInitials => FullName.Length > 0 ? FullName[..1].ToUpperInvariant() : "U";
    public bool    IsActive   { get; set; } = true;
    public DateTime CreatedAt  { get; set; } = DateTime.UtcNow;
    public DateTime LastLoginAt{ get; set; } = DateTime.UtcNow;

    public ICollection<PaperTemplate> Templates { get; set; } = [];
}

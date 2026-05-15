using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AskPaperGen.Models;

public class PaperTemplate
{
    public int Id { get; set; }
    [Required, MaxLength(200)] public string  Name        { get; set; } = string.Empty;
    [MaxLength(500)]           public string? Description { get; set; }
    public string? Category       { get; set; }
    public string? Subject        { get; set; }
    public string? Language       { get; set; } = "English";
    public string? ThumbnailClass { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public string SettingsJson { get; set; } = "{}";

    public string UserId { get; set; } = string.Empty;
    [ForeignKey(nameof(UserId))]
    public ApplicationUser? User { get; set; }

    public bool IsBuiltIn { get; set; } = false;
    public bool IsPublic  { get; set; } = false;
    public bool IsDeleted { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class SiteSettings
{
    public int  Id { get; set; } = 1;
    public bool PaperSavingDisabled { get; set; } = true;
    [MaxLength(600)]
    public string PaperSavingDisabledMessage { get; set; } =
        "Saving is disabled due to security concerns. You can still generate and download papers as PDF.";
}

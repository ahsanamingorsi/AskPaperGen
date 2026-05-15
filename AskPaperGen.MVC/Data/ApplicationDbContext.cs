using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using AskPaperGen.Models;

namespace AskPaperGen.Data;

public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
    : IdentityDbContext<ApplicationUser>(options)
{
    public DbSet<PaperTemplate> Templates  => Set<PaperTemplate>();
    public DbSet<SiteSettings>  SiteSettings => Set<SiteSettings>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        base.OnModelCreating(b);
        b.Entity<ApplicationUser>().ToTable("Users");
        b.Entity<PaperTemplate>(e => {
            e.HasOne(t => t.User).WithMany(u => u.Templates)
             .HasForeignKey(t => t.UserId).OnDelete(DeleteBehavior.Cascade);
            e.HasQueryFilter(t => !t.IsDeleted);
        });
        b.Entity<SiteSettings>().HasData(new SiteSettings { Id = 1 });
    }
}

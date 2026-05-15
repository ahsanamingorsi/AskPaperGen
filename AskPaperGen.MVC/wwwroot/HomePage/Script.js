// script.js - Interactive functionality for Advanced Examination Paper Generator

// ===== DOM CONTENT LOADED =====
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    initializeNavbar();
    initializeSmoothScroll();
    initializeButtons();
    initializeHoverEffects();
    initializeScrollAnimations();
    initializeDemoSimulation();
});

// ===== NAVBAR ACTIVE STATE & SCROLL EFFECT =====
function initializeNavbar() {
    const navbar = document.querySelector('.navbar');
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section, .hero-section');

    // Update active nav link on scroll
    window.addEventListener('scroll', function() {
        let current = '';
        const scrollPosition = window.scrollY + 100; // Offset for better accuracy

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                current = section.getAttribute('id') || 'home';
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href').replace('#', '');
            
            if (current === 'home' && href === '') {
                link.classList.add('active');
            } else if (current && href === current) {
                link.classList.add('active');
            } else if (!current && link.getAttribute('href') === '#') {
                link.classList.add('active');
            }
        });

        // Add background to navbar on scroll
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(255, 255, 255, 0.98)';
            navbar.style.backdropFilter = 'blur(10px)';
            navbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)';
        } else {
            navbar.style.background = 'var(--white)';
            navbar.style.backdropFilter = 'none';
            navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.03)';
        }
    });
}

// ===== SMOOTH SCROLL FOR NAVIGATION =====
function initializeSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            
            // Skip if it's just "#" (home) or empty
            if (targetId === '#' || targetId === '') {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
                return;
            }
            
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                const navbarHeight = document.querySelector('.navbar').offsetHeight;
                const targetPosition = targetElement.offsetTop - navbarHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });

                // Close mobile menu after click
                const navbarToggler = document.querySelector('.navbar-toggler');
                const navbarCollapse = document.querySelector('.navbar-collapse');
                
                if (navbarCollapse.classList.contains('show')) {
                    navbarToggler.click();
                }
            }
        });
    });
}

// ===== BUTTON INTERACTIONS =====
function initializeButtons() {
    // Generate Paper buttons
    const generateButtons = document.querySelectorAll('a[href="#"]:contains("Generate Paper")');
    document.querySelectorAll('.btn-primary, .btn-outline-light, .btn-outline-secondary').forEach(button => {
        if (button.textContent.includes('Generate Paper') || button.textContent.includes('Generate')) {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                simulatePaperGeneration();
            });
        }
    });

    // Sign Up buttons
    document.querySelectorAll('.btn-primary, .btn-light').forEach(button => {
        if (button.textContent.includes('Sign Up')) {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                showNotification('Sign up modal would open here', 'info');
            });
        }
    });

    // Login buttons
    document.querySelectorAll('.btn-outline-primary').forEach(button => {
        if (button.textContent.includes('Login')) {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                showNotification('Login form would appear here', 'info');
            });
        }
    });

    // View Demo button
    document.querySelector('.btn-outline-secondary')?.addEventListener('click', function(e) {
        e.preventDefault();
        startDemoTour();
    });
}

// ===== SIMULATE PAPER GENERATION =====
function simulatePaperGeneration() {
    const stages = [
        'Analyzing requirements...',
        'Creating sections...',
        'Adding questions...',
        'Formatting layout...',
        'Generating preview...'
    ];
    
    let currentStage = 0;
    
    // Create loading overlay
    const overlay = document.createElement('div');
    overlay.className = 'generation-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.95);
        z-index: 9999;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        backdrop-filter: blur(5px);
        transition: opacity 0.3s ease;
    `;
    
    overlay.innerHTML = `
        <div class="generation-container text-center" style="max-width: 400px;">
            <div class="spinner-border text-primary mb-4" style="width: 4rem; height: 4rem;" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <h4 class="mb-3">Generating Your Exam Paper</h4>
            <p class="text-secondary mb-4" id="generation-status">${stages[0]}</p>
            <div class="progress w-100" style="height: 8px;">
                <div class="progress-bar progress-bar-striped progress-bar-animated" 
                     id="generation-progress" 
                     role="progressbar" 
                     style="width: 0%; background: var(--primary-blue);" 
                     aria-valuenow="0" 
                     aria-valuemin="0" 
                     aria-valuemax="100">
                </div>
            </div>
            <button class="btn btn-link text-danger mt-4" id="cancel-generation" style="text-decoration: none;">
                <i class="fas fa-times me-2"></i>Cancel
            </button>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Animate through stages
    const interval = setInterval(() => {
        if (currentStage < stages.length) {
            document.getElementById('generation-status').textContent = stages[currentStage];
            const progress = ((currentStage + 1) / stages.length) * 100;
            document.getElementById('generation-progress').style.width = progress + '%';
            document.getElementById('generation-progress').setAttribute('aria-valuenow', progress);
            currentStage++;
        } else {
            clearInterval(interval);
            setTimeout(() => {
                overlay.style.opacity = '0';
                setTimeout(() => {
                    document.body.removeChild(overlay);
                    showNotification('✅ Exam paper generated successfully!', 'success');
                    simulatePreview();
                }, 300);
            }, 500);
        }
    }, 800);
    
    // Cancel button
    document.getElementById('cancel-generation').addEventListener('click', function() {
        clearInterval(interval);
        overlay.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(overlay);
            showNotification('Generation cancelled', 'warning');
        }, 300);
    });
}

// ===== SIMULATE PREVIEW =====
function simulatePreview() {
    // Create preview modal
    const previewModal = document.createElement('div');
    previewModal.className = 'preview-modal';
    previewModal.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 90%;
        max-width: 800px;
        max-height: 80vh;
        background: white;
        border-radius: 16px;
        box-shadow: 0 30px 60px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        overflow: hidden;
        animation: slideIn 0.3s ease;
    `;
    
    previewModal.innerHTML = `
        <div class="preview-header" style="
            background: var(--primary-blue);
            color: white;
            padding: 1.5rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        ">
            <h4 class="mb-0"><i class="fas fa-file-pdf me-2"></i>Exam Paper Preview</h4>
            <button class="btn-close btn-close-white" id="close-preview" aria-label="Close"></button>
        </div>
        <div class="preview-body" style="
            padding: 2rem;
            overflow-y: auto;
            max-height: calc(80vh - 80px);
            background: #f8f9fa;
        ">
            <div class="exam-paper" style="
                background: white;
                padding: 2rem;
                border-radius: 12px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.05);
            ">
                <div class="text-center mb-4">
                    <h2 class="fw-bold">Mathematics - Grade 10</h2>
                    <p class="text-secondary mb-1">Mid-Term Examination</p>
                    <p class="text-secondary">Time: 2 Hours | Max Marks: 50</p>
                </div>
                
                <div class="section mb-4">
                    <h5 class="fw-bold text-primary">Section A: Multiple Choice Questions (20 marks)</h5>
                    <div class="question mb-3">
                        <p><strong>1.</strong> What is the value of π to two decimal places?</p>
                        <div class="ms-3">
                            <div><input type="radio" disabled> a) 3.14</div>
                            <div><input type="radio" disabled> b) 3.16</div>
                            <div><input type="radio" disabled> c) 3.12</div>
                            <div><input type="radio" disabled> d) 3.18</div>
                        </div>
                    </div>
                    <div class="question mb-3">
                        <p><strong>2.</strong> Which of these is a prime number?</p>
                        <div class="ms-3">
                            <div><input type="radio" disabled> a) 51</div>
                            <div><input type="radio" disabled> b) 57</div>
                            <div><input type="radio" disabled> c) 59</div>
                            <div><input type="radio" disabled> d) 63</div>
                        </div>
                    </div>
                </div>
                
                <div class="section mb-4">
                    <h5 class="fw-bold text-primary">Section B: Short Answer Questions (30 marks)</h5>
                    <div class="question mb-3">
                        <p><strong>3.</strong> Solve the equation: 2x + 5 = 15 (5 marks)</p>
                        <div class="bg-light p-3 rounded">
                            <em>Answer space provided...</em>
                        </div>
                    </div>
                    <div class="question mb-3">
                        <p><strong>4.</strong> Calculate the area of a circle with radius 7cm. (5 marks)</p>
                        <div class="text-center mb-2">
                            <i class="fas fa-circle text-primary" style="font-size: 3rem;"></i>
                        </div>
                        <div class="bg-light p-3 rounded">
                            <em>Answer space with diagram reference...</em>
                        </div>
                    </div>
                </div>
                
                <div class="text-center text-secondary small">
                    --- End of Paper ---
                </div>
            </div>
        </div>
        <div class="preview-footer" style="
            padding: 1rem 1.5rem;
            border-top: 1px solid #dee2e6;
            display: flex;
            justify-content: flex-end;
            gap: 1rem;
            background: white;
        ">
            <button class="btn btn-outline-secondary" id="preview-edit">
                <i class="fas fa-edit me-2"></i>Edit
            </button>
            <button class="btn btn-primary" id="preview-download">
                <i class="fas fa-download me-2"></i>Download PDF
            </button>
        </div>
    `;
    
    // Add animation keyframes
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translate(-50%, -40%);
            }
            to {
                opacity: 1;
                transform: translate(-50%, -50%);
            }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(previewModal);
    
    // Add backdrop
    const backdrop = document.createElement('div');
    backdrop.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 9999;
        animation: fadeIn 0.3s ease;
    `;
    document.body.appendChild(backdrop);
    
    // Close handlers
    const closeModal = () => {
        document.body.removeChild(previewModal);
        document.body.removeChild(backdrop);
    };
    
    document.getElementById('close-preview').addEventListener('click', closeModal);
    backdrop.addEventListener('click', closeModal);
    
    document.getElementById('preview-edit').addEventListener('click', function() {
        closeModal();
        showNotification('Opening editor...', 'info');
    });
    
    document.getElementById('preview-download').addEventListener('click', function() {
        showNotification('📥 Downloading PDF...', 'success');
        setTimeout(() => {
            showNotification('PDF downloaded successfully!', 'success');
        }, 1500);
    });
}

// ===== DEMO TOUR =====
function startDemoTour() {
    const steps = [
        {
            element: '#features',
            title: 'Powerful Features',
            message: 'Create section-based exams with MCQs, images, and tables'
        },
        {
            element: '#how-it-works',
            title: 'Simple Process',
            message: 'Just 3 steps to generate your professional exam paper'
        },
        {
            element: '.cta-section',
            title: 'Get Started',
            message: 'Sign up now and create your first exam paper!'
        }
    ];
    
    let currentStep = 0;
    
    function showStep(stepIndex) {
        if (stepIndex >= steps.length) {
            showNotification('Tour completed! Ready to create your paper?', 'success');
            return;
        }
        
        const step = steps[stepIndex];
        const targetElement = document.querySelector(step.element);
        
        if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            setTimeout(() => {
                showTourTooltip(targetElement, step.title, step.message, stepIndex, steps.length);
            }, 500);
        }
    }
    
    showStep(0);
}

function showTourTooltip(element, title, message, current, total) {
    // Remove existing tooltips
    document.querySelectorAll('.tour-tooltip').forEach(el => el.remove());
    
    const rect = element.getBoundingClientRect();
    const tooltip = document.createElement('div');
    tooltip.className = 'tour-tooltip';
    tooltip.style.cssText = `
        position: absolute;
        top: ${rect.top + window.scrollY + rect.height + 10}px;
        left: ${rect.left + window.scrollX + rect.width / 2}px;
        transform: translateX(-50%);
        background: white;
        padding: 1.5rem;
        border-radius: 12px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        max-width: 350px;
        border: 1px solid var(--primary-blue);
        animation: fadeInUp 0.3s ease;
    `;
    
    tooltip.innerHTML = `
        <div class="tour-arrow" style="
            position: absolute;
            top: -10px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 10px solid transparent;
            border-right: 10px solid transparent;
            border-bottom: 10px solid var(--primary-blue);
        "></div>
        <h5 class="fw-bold mb-2">${title}</h5>
        <p class="text-secondary mb-3">${message}</p>
        <div class="d-flex justify-content-between align-items-center">
            <small class="text-secondary">Step ${current + 1}/${total}</small>
            <div>
                <button class="btn btn-sm btn-outline-secondary me-2" id="tour-skip">Skip</button>
                <button class="btn btn-sm btn-primary" id="tour-next">
                    ${current + 1 === total ? 'Finish' : 'Next'}
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(tooltip);
    
    document.getElementById('tour-next').addEventListener('click', function() {
        tooltip.remove();
        startDemoTourStep(current + 1);
    });
    
    document.getElementById('tour-skip').addEventListener('click', function() {
        tooltip.remove();
        showNotification('Tour skipped. Explore on your own!', 'info');
    });
}

// Helper for demo tour steps
function startDemoTourStep(step) {
    const steps = [
        {
            element: '#features',
            title: 'Powerful Features',
            message: 'Create section-based exams with MCQs, images, and tables'
        },
        {
            element: '#how-it-works',
            title: 'Simple Process',
            message: 'Just 3 steps to generate your professional exam paper'
        },
        {
            element: '.cta-section',
            title: 'Get Started',
            message: 'Sign up now and create your first exam paper!'
        }
    ];
    
    if (step < steps.length) {
        const stepData = steps[step];
        const targetElement = document.querySelector(stepData.element);
        
        if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => {
                showTourTooltip(targetElement, stepData.title, stepData.message, step, steps.length);
            }, 500);
        }
    } else {
        showNotification('🎉 Tour completed! Ready to create your first paper?', 'success');
    }
}

// ===== HOVER EFFECTS =====
function initializeHoverEffects() {
    // Feature cards interactive icons
    document.querySelectorAll('.feature-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            const icon = this.querySelector('.feature-icon i');
            if (icon) {
                icon.style.transform = 'scale(1.1)';
            }
        });
        
        card.addEventListener('mouseleave', function() {
            const icon = this.querySelector('.feature-icon i');
            if (icon) {
                icon.style.transform = 'scale(1)';
            }
        });
    });
    
    // Step cards
    document.querySelectorAll('.step-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            const number = this.querySelector('.rounded-circle span');
            if (number) {
                number.style.transform = 'scale(1.1)';
            }
        });
        
        card.addEventListener('mouseleave', function() {
            const number = this.querySelector('.rounded-circle span');
            if (number) {
                number.style.transform = 'scale(1)';
            }
        });
    });
}

// ===== SCROLL ANIMATIONS =====
function initializeScrollAnimations() {
    const animatedElements = document.querySelectorAll('.feature-card, .step-card, .list-unstyled li');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.2 });
    
    animatedElements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(element);
    });
}

// ===== NOTIFICATION SYSTEM =====
function showNotification(message, type = 'info') {
    // Remove existing notification
    const existingNotification = document.querySelector('.custom-notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = 'custom-notification';
    
    const colors = {
        success: '#28a745',
        error: '#dc3545',
        warning: '#ffc107',
        info: '#17a2b8'
    };
    
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: white;
        color: ${colors[type]};
        padding: 1rem 1.5rem;
        border-radius: 50px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.15);
        z-index: 10001;
        display: flex;
        align-items: center;
        gap: 12px;
        border-left: 4px solid ${colors[type]};
        animation: slideInRight 0.3s ease;
        font-weight: 500;
        max-width: 350px;
    `;
    
    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-check-circle';
    if (type === 'error') icon = 'fa-exclamation-circle';
    if (type === 'warning') icon = 'fa-exclamation-triangle';
    
    notification.innerHTML = `
        <i class="fas ${icon}" style="color: ${colors[type]};"></i>
        <span style="color: #2c3e50;">${message}</span>
        <button class="btn-close ms-3" style="font-size: 0.8rem;" onclick="this.parentElement.remove()"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }
    }, 3000);
    
    // Add animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
    `;
    document.head.appendChild(style);
}

// ===== UTILITY FUNCTIONS =====
// Contains text helper for buttons
Element.prototype.contains = function(text) {
    return this.textContent.trim().includes(text);
};

// Add CSS variables if not defined in style.css
document.documentElement.style.setProperty('--primary-blue', '#2b6c9e');
document.documentElement.style.setProperty('--white', '#ffffff');

// Initialize any tooltips or popovers
document.addEventListener('DOMContentLoaded', function() {
    if (typeof bootstrap !== 'undefined') {
        // Enable Bootstrap tooltips if needed
        var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function(tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }
});
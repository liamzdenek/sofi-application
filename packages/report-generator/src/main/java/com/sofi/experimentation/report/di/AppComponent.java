package com.sofi.experimentation.report.di;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sofi.experimentation.report.service.ReportGenerationService;
import dagger.Component;
import javax.inject.Singleton;

/**
 * Dagger component for the application.
 */
@Singleton
@Component(modules = {AppModule.class, ServiceModule.class})
public interface AppComponent {
    ReportGenerationService reportGenerationService();
    ObjectMapper objectMapper();
    
    @Component.Builder
    interface Builder {
        AppComponent build();
    }
}
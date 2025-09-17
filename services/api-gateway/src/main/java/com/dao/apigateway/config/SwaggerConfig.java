package com.dao.apigateway.config;

import org.springdoc.core.models.GroupedOpenApi;
import org.springframework.cloud.gateway.handler.predicate.PredicateDefinition;
import org.springframework.cloud.gateway.route.RouteDefinition;
import org.springframework.cloud.gateway.route.RouteDefinitionLocator;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.ArrayList;
import java.util.List;

@Configuration
public class SwaggerConfig {

    private final RouteDefinitionLocator locator;

    public SwaggerConfig(RouteDefinitionLocator locator) {
        this.locator = locator;
    }

    @Bean
    public List<GroupedOpenApi> apis() {
        List<GroupedOpenApi> groups = new ArrayList<>();
        List<RouteDefinition> definitions = locator.getRouteDefinitions().collectList().block();
        if (definitions == null) {
            return groups;
        }
        definitions.stream()
                .filter(routeDefinition -> routeDefinition.getId().matches(".*-service"))
                .forEach(routeDefinition -> {
                    String name = routeDefinition.getId().replace("-service", "");
                    for (PredicateDefinition predicate : routeDefinition.getPredicates()) {
                        if ("Path".equals(predicate.getName())) {
                            String path = predicate.getArgs().values().iterator().next();
                            groups.add(GroupedOpenApi.builder().pathsToMatch(path).group(name).build());
                            break;
                        }
                    }
                });
        return groups;
    }
}
